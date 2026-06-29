import { GoogleGenAI, Type } from "@google/genai";

export { Type };

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function retryWithBackoffAndFallback(
  client: GoogleGenAI,
  modelList: string[],
  contents: any[],
  config: any,
  retriesPerModel: number = 3,
  delay: number = 1000
): Promise<any> {
  let lastError: any = null;

  for (const model of modelList) {
    let attempts = retriesPerModel;
    let currentDelay = delay;
    while (attempts > 0) {
      try {
        console.log(`Attempting Gemini API request with model: ${model}`);
        const response = await client.models.generateContent({
          model,
          contents,
          config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        const status = error?.status || error?.code || error?.status_code;
        
        // Check if error represents a daily quota limit exhaustion
        const isDailyLimitExceeded = 
          errorMsg.includes("PerDay") || 
          errorMsg.includes("RequestsPerDay") || 
          errorMsg.includes("daily") ||
          JSON.stringify(error).includes("PerDay") ||
          JSON.stringify(error).includes("RequestsPerDay");

        // Check if the model is rate-limited / has exhausted standard requests per minute (429 / RESOURCE_EXHAUSTED)
        const isRateLimited =
          status === 429 ||
          errorMsg.includes("429") ||
          errorMsg.includes("Quota exceeded") ||
          errorMsg.includes("RESOURCE_EXHAUSTED") ||
          errorMsg.includes("rate-limits") ||
          JSON.stringify(error).includes("RESOURCE_EXHAUSTED") ||
          JSON.stringify(error).includes("Quota exceeded");

        const isHighDemand =
          status === 503 ||
          errorMsg.includes("503") ||
          errorMsg.includes("UNAVAILABLE") ||
          errorMsg.includes("high demand") ||
          errorMsg.includes("temporary");

        if (isDailyLimitExceeded || isRateLimited || isHighDemand) {
          console.log(`Model ${model} is rate-limited, overloaded, or unavailable. Skipping retries and moving immediately to next model fallback...`);
          break; // Break the attempts loop to move to the next model immediately
        }

        // For any other unexpected errors, failover immediately to the next fallback model to preserve uptime
        console.log(`Expected failover on model ${model}:`, error);
        break;
      }
    }
    console.log(`Model ${model} completed attempt. Checking fallback list if needed...`);
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  history: any[] = [],
  forceJson: boolean = false,
  responseSchema?: any
): Promise<string> {
  try {
    const client = getGeminiClient();
    
    // Convert history format to Google GenAI format: { role, parts: [{ text }] }
    const contents: any[] = [];
    
    if (history && history.length > 0) {
      for (const turn of history) {
        // Normalize role names
        const role = turn.role === "assistant" || turn.role === "model" ? "model" : "user";
        
        let parts: any[] = [];
        if (Array.isArray(turn.parts)) {
          parts = turn.parts.map((p: any) => {
            if (typeof p === "string") return { text: p };
            if (p && typeof p === "object" && p.text) return { text: p.text };
            return { text: JSON.stringify(p) };
          });
        } else if (turn.parts) {
          parts = [{ text: typeof turn.parts === "string" ? turn.parts : JSON.stringify(turn.parts) }];
        } else if (turn.text) {
          parts = [{ text: turn.text }];
        } else {
          parts = [{ text: "" }];
        }
        
        contents.push({ role, parts });
      }
    }
    
    // Push final user prompt
    contents.push({
      role: "user",
      parts: [{ text: userPrompt }]
    });

    const config: any = {
      systemInstruction: systemPrompt,
    };

    if (forceJson) {
      config.responseMimeType = "application/json";
    }

    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

    // List of models in order of preference for the task.
    // We utilize a highly resilient fallback chain across different model families
    // (gemini-3.5, gemini-2.5, gemini-3.1, and gemini-flash) to guarantee service availability
    // and route around any rate limits or high-demand transient errors.
    const models = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    const response = await retryWithBackoffAndFallback(
      client,
      models,
      contents,
      config
    );

    return response.text || "";
  } catch (error: any) {
    console.error("Error in callGemini:", error);
    throw error;
  }
}
