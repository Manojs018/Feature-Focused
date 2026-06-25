import express, { Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "./auth";
import { callGemini, Type } from "./gemini";
import * as db from "./db";

export const apiRouter = express.Router();

const COACH_SYSTEM_PROMPT = `You are a proactive productivity coach inside The Last-Minute Life Saver app. You help students, professionals, and entrepreneurs beat deadlines by being direct, practical, and action-oriented. Never give vague or generic advice. Always give specific, concrete next steps tailored to the actual tasks provided. When analyzing tasks, consider urgency (deadline proximity), effort required, dependencies between tasks, and the user's overall workload. Be motivating but honest — if something is overdue or risky, say so clearly.`;

// ----------------------------------------------------
// UTILS
// ----------------------------------------------------
function getDatesInPastWeek(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// ----------------------------------------------------
// TASK ROUTES
// ----------------------------------------------------
apiRouter.get("/tasks", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const tasks = await db.getUserTasks(uid);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/tasks", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { title, description, deadline, priority, category } = req.body;
    
    if (!title || !deadline || !priority || !category) {
      return res.status(400).json({ error: "Missing required fields (title, deadline, priority, category)" });
    }

    const newTask = await db.createTask(uid, {
      title,
      description: description || "",
      deadline,
      priority,
      category,
    });
    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put("/tasks/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const taskId = req.params.id;
    const updates = req.body;

    const updated = await db.updateTask(uid, taskId, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete("/tasks/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const taskId = req.params.id;

    await db.deleteTask(uid, taskId);
    res.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put("/tasks/:id/complete", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const taskId = req.params.id;

    // Get the task to check the deadline
    const tasks = await db.getUserTasks(uid);
    const task: any = tasks.find((t: any) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.completed) {
      return res.status(400).json({ error: "Task already completed" });
    }

    const completedAt = new Date().toISOString();
    const isOnTime = new Date(completedAt) <= new Date(task.deadline);

    // Update task
    await db.updateTask(uid, taskId, {
      completed: true,
      completedAt,
      onTime: isOnTime,
    });

    // Update user stats
    const stats: any = await db.getUserStats(uid);
    
    const updatedStats: any = {
      ...stats,
      completedThisWeek: (stats.completedThisWeek || 0) + 1,
      totalCompleted: (stats.totalCompleted || 0) + 1,
      onTimeCount: (stats.onTimeCount || 0) + (isOnTime ? 1 : 0),
      lateCount: (stats.lateCount || 0) + (isOnTime ? 0 : 1),
      lastCompletedDate: completedAt.split("T")[0],
    };

    // Simple Streak calculation
    const todayStr = new Date().toISOString().split("T")[0];
    if (stats.lastCompletedDate) {
      const lastDate = new Date(stats.lastCompletedDate);
      const diffTime = Math.abs(new Date(todayStr).getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        updatedStats.currentStreak = (stats.currentStreak || 0) + (diffDays === 1 ? 1 : 0);
      } else {
        updatedStats.currentStreak = 1;
      }
    } else {
      updatedStats.currentStreak = 1;
    }

    await db.updateUserStats(uid, updatedStats);

    res.json({ message: "Task completed!", onTime: isOnTime, stats: updatedStats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// AI ROUTES
// ----------------------------------------------------
apiRouter.post("/ai/briefing", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tasks } = req.body;
    if (!tasks) {
      return res.status(400).json({ error: "Missing tasks in request body" });
    }

    const userPrompt = `Here are my tasks for today: ${JSON.stringify(tasks)}. Generate a short, motivating Today's Briefing (3-4 sentences) that tells me exactly what to focus on today and why. Be direct and urgent where needed. Keep it action-oriented and highly practical.`;
    
    const briefing = await callGemini(COACH_SYSTEM_PROMPT, userPrompt);
    res.json({ briefing });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/ai/prioritize", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Missing tasks array in request body" });
    }

    if (tasks.length === 0) {
      return res.json([]);
    }

    const userPrompt = `Analyze these tasks and return a valid JSON array of prioritization insights.
Each object in the array MUST have exactly these fields:
- "id": (string, must match the task id exactly)
- "priorityScore": (number, 1-10 rating of how urgent/critical this task is right now)
- "tip": (string, exactly one specific, high-impact, actionable action tip for this task)
- "suggestedTime": (string, recommended exact time or window to do this, e.g., "Tonight 8 PM", "Tomorrow morning")
- "estimatedMinutes": (number, estimation of time needed to complete)

Tasks: ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, priority: t.priority, category: t.category })))}`;

    const prioritizeSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "The task ID."
          },
          priorityScore: {
            type: Type.INTEGER,
            description: "A 1 to 10 rating of urgency."
          },
          tip: {
            type: Type.STRING,
            description: "A specific, action-oriented tip."
          },
          suggestedTime: {
            type: Type.STRING,
            description: "Recommended completion timeframe."
          },
          estimatedMinutes: {
            type: Type.INTEGER,
            description: "Estimated completion time in minutes."
          }
        },
        required: ["id", "priorityScore", "tip", "suggestedTime", "estimatedMinutes"]
      }
    };

    const responseText = await callGemini(COACH_SYSTEM_PROMPT, userPrompt, [], true, prioritizeSchema);
    
    try {
      // Parse the JSON. Clean up code fences just in case
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (parseError) {
      console.warn("Could not parse AI response as JSON, using robust fallback. Raw text:", responseText);
      // Fallback in case JSON parsing fails
      const fallback = tasks.map(t => ({
        id: t.id,
        priorityScore: t.priority === "High" ? 9 : t.priority === "Medium" ? 6 : 3,
        tip: "Focus on getting this task started without distraction.",
        suggestedTime: "As soon as possible",
        estimatedMinutes: 45
      }));
      res.json(fallback);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/ai/chat", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { history, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing message in request body" });
    }

    const updatedHistory = history || [];
    const reply = await callGemini(COACH_SYSTEM_PROMPT, message, updatedHistory);
    
    // Add current user turn and assistant response turn
    const resultHistory = [
      ...updatedHistory,
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: reply }] }
    ];

    res.json({ reply, history: resultHistory });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/ai/breakdown", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { task } = req.body;
    if (!task) {
      return res.status(400).json({ error: "Missing task in request body" });
    }

    const userPrompt = `Break this task down into 4-6 concrete, highly actionable, byte-sized subtasks. Return a valid JSON array of strings.
Task details:
Title: ${task.title}
Description: ${task.description || "None"}
Deadline: ${task.deadline}
Priority: ${task.priority}`;

    const breakdownSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      }
    };

    const responseText = await callGemini(COACH_SYSTEM_PROMPT, userPrompt, [], true, breakdownSchema);
    
    try {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (parseError) {
      console.warn("Could not parse breakdown as JSON, using fallback. Raw text:", responseText);
      res.json([
        "Prepare necessary tools and workspace",
        "Set a 25-minute uninterrupted timer (Pomodoro)",
        "Complete the most critical core requirement first",
        "Review details against task description",
        "Submit or mark task as 100% completed"
      ]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/ai/weekly-insights", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tasks, habits, logs } = req.body;
    const activeTasks = tasks || [];
    const activeHabits = habits || [];
    const activeLogs = logs || [];

    const userPrompt = `Generate a highly personalized weekly productivity analysis for me. 
Analyze my tasks: ${JSON.stringify(activeTasks)}
Analyze my habits: ${JSON.stringify(activeHabits)} and logs: ${JSON.stringify(activeLogs)}

Provide the analysis structure in 4 sections:
1. WHAT WENT WELL: Highlighting completions and on-time tasks.
2. WHAT WAS MISSED: Highlighting overdue tasks and skipped habits.
3. BEHAVIORAL PATTERNS NOTICED: Pinpointing procrastinations, peak categories, etc.
4. SPECIFIC ACTION RECOMMENDATIONS: Give 3 specific recommendations for next week.

Be motivating but direct and honest.`;

    const analysis = await callGemini(COACH_SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// HABIT ROUTES
// ----------------------------------------------------
apiRouter.get("/habits", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const habits = await db.getUserHabits(uid);
    res.json(habits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/habits", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { name, frequency, targetCount } = req.body;

    if (!name || !frequency || !targetCount) {
      return res.status(400).json({ error: "Missing required fields (name, frequency, targetCount)" });
    }

    const newHabit = await db.createHabit(uid, {
      name,
      frequency,
      targetCount: Number(targetCount),
    });
    res.status(201).json(newHabit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/habits/:id/log", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const habitId = req.params.id;
    const { date, done } = req.body;

    if (!date || done === undefined) {
      return res.status(400).json({ error: "Missing date or done field" });
    }

    const log = await db.logHabitCompletion(uid, habitId, date, done);
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/habits/streak/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const habitId = req.params.id;

    const allLogs = await db.getHabitLogs(uid);
    const habitLogs = allLogs
      .filter((l: any) => l.habitId === habitId && l.done)
      .map((l: any) => l.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // sort desc

    if (habitLogs.length === 0) {
      return res.json({ streak: 0 });
    }

    let streak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Check if habit is logged today or yesterday to continue streak
    if (habitLogs[0] !== todayStr && habitLogs[0] !== yesterdayStr) {
      return res.json({ streak: 0 });
    }

    let expectedDate = new Date(habitLogs[0]);
    streak = 1;

    for (let i = 1; i < habitLogs.length; i++) {
      const actualDate = new Date(habitLogs[i]);
      const diffTime = Math.abs(expectedDate.getTime() - actualDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
        expectedDate = actualDate;
      } else if (diffDays === 0) {
        // duplicate log for same day, skip
        continue;
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// REMINDER ROUTES
// ----------------------------------------------------
apiRouter.post("/reminders/schedule", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { taskId, taskTitle, reminderTime, fcmToken } = req.body;

    if (!taskId || !taskTitle || !reminderTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const reminder = await db.createReminder({
      uid,
      taskId,
      taskTitle,
      fcmToken: fcmToken || "",
      reminderTime,
    });

    res.status(201).json(reminder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cloud Scheduler triggers:
apiRouter.post("/reminders/trigger", async (req: express.Request, res: Response) => {
  try {
    const isMock = req.headers["x-scheduler-secret"] === "scheduler-secret" || true; // Allow triggering for local testing
    
    const pending = await db.getPendingReminders();
    console.log(`Processing ${pending.length} pending reminders...`);

    for (const reminder of pending) {
      const r = reminder as any;
      // In sandbox, FCM notification logic is mock/simulation, but let's log it
      console.log(`[FCM NOTIFICATION] Sending push to token ${r.fcmToken || "N/A"}: 'Deadline Reminder: ${r.taskTitle}'`);
      await db.updateReminderStatus(r.id, "sent");
    }

    res.json({ processedCount: pending.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/reminders/morning-briefing", async (req: express.Request, res: Response) => {
  try {
    console.log("Processing morning briefings at 8:00 AM...");
    const users = await db.getAllUsersWithFcm();
    
    for (const user of users) {
      const tasks = await db.getUserTasks(user.uid);
      const todayStr = new Date().toISOString().split("T")[0];
      const todayTasks = tasks.filter((t: any) => t.deadline.startsWith(todayStr) && !t.completed);
      
      if (todayTasks.length > 0) {
        const briefingPrompt = `Here are my tasks for today: ${JSON.stringify(todayTasks)}. Generate a 1-sentence urgent morning coaching reminder to beat these deadlines.`;
        const briefing = await callGemini(COACH_SYSTEM_PROMPT, briefingPrompt);
        
        console.log(`[FCM MORNING BRIEFING] Sent to user ${user.uid}: "${briefing}"`);
      }
    }

    res.json({ success: true, processedUsersCount: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// INSIGHTS ROUTE
// ----------------------------------------------------
apiRouter.get("/insights", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const stats = await db.getUserStats(uid);
    const tasks = await db.getUserTasks(uid);
    const habits = await db.getUserHabits(uid);
    const logs = await db.getHabitLogs(uid);

    // Calculate onTimeRate
    const onTimeCount = stats.onTimeCount || 0;
    const lateCount = stats.lateCount || 0;
    const totalCount = onTimeCount + lateCount;
    const onTimeRate = totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 100;

    // Calculate completions in past 7 days for chart
    const pastWeekDates = getDatesInPastWeek();
    const taskCompletionByDay = pastWeekDates.map(date => {
      const count = tasks.filter((t: any) => t.completed && t.completedAt && t.completedAt.startsWith(date)).length;
      return { date, count };
    });

    res.json({
      completedThisWeek: stats.completedThisWeek || 0,
      onTimeRate,
      currentStreak: stats.currentStreak || 0,
      totalActiveTasks: tasks.filter((t: any) => !t.completed).length,
      taskCompletionByDay,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save FCM Token endpoint
apiRouter.post("/user/fcm", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { token } = req.body;
    if (token) {
      await db.saveFcmToken(uid, token);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
