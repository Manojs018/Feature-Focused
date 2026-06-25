import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Mic, MicOff, Volume2, VolumeX, Bot, Loader2, ArrowRight } from "lucide-react";

interface ChatInterfaceProps {
  tasks: any[];
  chat: (history: any[], message: string) => Promise<{ reply: string; history: any[] }>;
  breakdownTask: (task: any) => Promise<string[]>;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ChatInterface({ tasks, chat, breakdownTask }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Suggested prompt chips
  const suggestions = [
    "What should I work on right now?",
    "Plan my day",
    "I'm overwhelmed, help me prioritize",
    "Break down my hardest task",
  ];

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lmls_chat_history_v2");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("lmls_chat_history_v2");
      }
    } else {
      // Intro greeting message
      const initialGreeting = [
        {
          role: "model",
          parts: [
            {
              text: "Hey! I am your Last-Minute Productivity Coach. The deadlines are approaching and I'm here to make sure you crush them. Speak or type your message, and let's make a real, high-speed plan of attack right now!",
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(initialGreeting);
      localStorage.setItem("lmls_chat_history_v2", JSON.stringify(initialGreeting));
    }
  }, []);

  // Save messages to localStorage and scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("lmls_chat_history_v2", JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle Speech Synthesis (Speak Reply Aloud)
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Pick a nicer English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith("en-") && v.name.includes("Google"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend: string) => {
    const msg = textToSend.trim() || input.trim();
    if (!msg) return;

    setInput("");
    setLoading(true);

    // Append user message
    const updatedUserMessages = [
      ...messages,
      {
        role: "user",
        parts: [{ text: msg }],
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(updatedUserMessages);

    try {
      // Construct prompt with embedded tasks info for better context-aware coaching
      const contextPrompt = msg + `\n\n(Current User Tasks Context: ${JSON.stringify(
        tasks.map((t) => ({ title: t.title, deadline: t.deadline, priority: t.priority, category: t.category, completed: t.completed }))
      )})`;

      const result = await chat(messages, contextPrompt);
      
      // We want to store the actual clean reply and history in messages
      const updatedAllMessages = [
        ...updatedUserMessages,
        {
          role: "model",
          parts: [{ text: result.reply }],
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(updatedAllMessages);

      // Trigger TTS voice read aloud
      speakText(result.reply);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Keep handleSend reference fresh for the speech recognition callback
  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSendRef.current(transcript);
        }
      };

      rec.onerror = (err: any) => {
        const errorType = err?.error || "unknown";
        console.error("Speech Recognition Error:", errorType);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      // Cleanup speaking if unmounting
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Stop talking before listening
      }
      recognitionRef.current.start();
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      const initialGreeting = [
        {
          role: "model",
          parts: [
            {
              text: "Reset complete. Let's start fresh. Tell me, what's our biggest deadline roadblock today?",
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(initialGreeting);
      localStorage.setItem("lmls_chat_history_v2", JSON.stringify(initialGreeting));
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl h-[calc(100vh-10rem)] overflow-hidden shadow-sm font-sans">
      {/* Header bar */}
      <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-2xl text-white shadow-md shadow-blue-500/15">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">Productivity Coach AI</h3>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold tracking-widest uppercase flex items-center gap-1.5 font-display">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Live & Voice-Enabled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
              voiceEnabled
                ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                : "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title={voiceEnabled ? "Mute Voice Synthesis" : "Unmute Voice Synthesis"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset chat */}
          <button
            onClick={clearChat}
            className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
          >
            Clear Thread
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-slate-950/20">
        {messages.map((m, idx) => {
          const isAI = m.role === "model" || m.role === "assistant";
          const text = m.parts?.[0]?.text || "";
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${isAI ? "self-start mr-auto" : "self-end ml-auto flex-row-reverse"}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 self-end mb-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isAI
                    ? "bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 font-medium shadow-sm"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/10"
                }`}
              >
                <p className="whitespace-pre-line">{text}</p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 self-start mr-auto max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 self-end mb-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 rounded-2xl px-4 py-3.5 flex items-center gap-1.5 self-center shadow-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts footer row */}
      {messages.length <= 1 && (
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-200 dark:border-slate-800/40 flex gap-2 overflow-x-auto flex-wrap">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(s);
                handleSend(s);
              }}
              className="text-xs font-bold px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 rounded-full whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer"
            >
              {s}
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {/* Input controls bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <button
          onClick={handleMicClick}
          className={`p-3.5 rounded-full transition-all duration-200 shadow-sm cursor-pointer ${
            isListening
              ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
              : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300"
          }`}
          title={isListening ? "Listening... Click to cancel" : "Start Voice Assistance"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex-1 flex gap-2.5"
        >
          <input
            type="text"
            placeholder={isListening ? "Listening to your voice..." : "Ask your Coach: 'Help me plan my study block'..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isListening}
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500/50 rounded-xl px-5 py-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all duration-200 font-medium"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 text-white font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
