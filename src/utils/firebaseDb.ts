import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDoc 
} from "firebase/firestore";
import { db } from "../firebase";

// Fallback Mock Defaults
const MOCK_TASKS_KEY = "lmls_tasks_";
const MOCK_HABITS_KEY = "lmls_habits_";
const MOCK_LOGS_KEY = "lmls_logs_";
const MOCK_STATS_KEY = "lmls_stats_";

const DEFAULT_MOCK_TASKS = [
  {
    id: "mock_t1",
    title: "Micro1-Interview Prep",
    description: "Web development interview preparation and mock coding questions",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "High",
    category: "Work",
    cognitiveType: "Creative Session",
    completed: false,
    completedAt: null,
    onTime: null,
    createdAt: new Date().toISOString()
  },
  {
    id: "mock_t2",
    title: "Math Homework Assignment",
    description: "Complete chapter 4 algebra and calculus proof questions",
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    priority: "High",
    category: "Study",
    cognitiveType: "Deep Work",
    completed: false,
    completedAt: null,
    onTime: null,
    createdAt: new Date().toISOString()
  },
  {
    id: "mock_t4",
    title: "Database Indexing Strategy",
    description: "Formulate performance metrics and index schemes for client databases",
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now (consecutive high block!)
    priority: "High",
    category: "Work",
    cognitiveType: "Deep Work",
    completed: false,
    completedAt: null,
    onTime: null,
    createdAt: new Date().toISOString()
  },
  {
    id: "mock_t3",
    title: "Review Financial Statements",
    description: "Check monthly bank and card logs for subscriptions",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "Low",
    category: "Finance",
    cognitiveType: "Admin Work",
    completed: true,
    completedAt: new Date().toISOString(),
    onTime: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_MOCK_HABITS = [
  {
    id: "mock_h1",
    name: "Solve 1 LeetCode Problem",
    frequency: "daily",
    targetCount: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: "mock_h2",
    name: "Read 10 Pages",
    frequency: "daily",
    targetCount: 1,
    createdAt: new Date().toISOString()
  }
];

// Helper to get dates for the past week
export function getDatesInPastWeek(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// Tasks API
export async function getUserTasks(uid: string, isMock: boolean): Promise<any[]> {
  if (isMock) {
    const key = MOCK_TASKS_KEY + uid;
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_MOCK_TASKS));
      return DEFAULT_MOCK_TASKS;
    }
    return JSON.parse(stored);
  }

  const q = query(collection(db, "users", uid, "tasks"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createTask(uid: string, isMock: boolean, taskData: any): Promise<any> {
  const data = {
    ...taskData,
    completed: false,
    completedAt: null,
    onTime: null,
    createdAt: new Date().toISOString(),
  };

  if (isMock) {
    const key = MOCK_TASKS_KEY + uid;
    const tasks = await getUserTasks(uid, isMock);
    const newTask = { id: "task_" + Math.random().toString(36).substr(2, 9), ...data };
    localStorage.setItem(key, JSON.stringify([...tasks, newTask]));
    return newTask;
  }

  const ref = doc(collection(db, "users", uid, "tasks"));
  await setDoc(ref, data);
  return { id: ref.id, ...data };
}

export async function updateTask(uid: string, isMock: boolean, taskId: string, updates: any): Promise<any> {
  if (isMock) {
    const key = MOCK_TASKS_KEY + uid;
    const tasks = await getUserTasks(uid, isMock);
    const updated = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    localStorage.setItem(key, JSON.stringify(updated));
    return { id: taskId, ...updates };
  }

  const ref = doc(db, "users", uid, "tasks", taskId);
  await updateDoc(ref, updates);
  return { id: taskId, ...updates };
}

export async function deleteTask(uid: string, isMock: boolean, taskId: string): Promise<any> {
  if (isMock) {
    const key = MOCK_TASKS_KEY + uid;
    const tasks = await getUserTasks(uid, isMock);
    const updated = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(key, JSON.stringify(updated));
    return { success: true };
  }

  const ref = doc(db, "users", uid, "tasks", taskId);
  await deleteDoc(ref);
  return { success: true };
}

// Habits API
export async function getUserHabits(uid: string, isMock: boolean): Promise<any[]> {
  if (isMock) {
    const key = MOCK_HABITS_KEY + uid;
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_MOCK_HABITS));
      return DEFAULT_MOCK_HABITS;
    }
    return JSON.parse(stored);
  }

  const q = query(collection(db, "users", uid, "habits"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createHabit(uid: string, isMock: boolean, habitData: any): Promise<any> {
  const data = {
    ...habitData,
    createdAt: new Date().toISOString(),
  };

  if (isMock) {
    const key = MOCK_HABITS_KEY + uid;
    const habits = await getUserHabits(uid, isMock);
    const newHabit = { id: "habit_" + Math.random().toString(36).substr(2, 9), ...data };
    localStorage.setItem(key, JSON.stringify([newHabit, ...habits]));
    return newHabit;
  }

  const ref = doc(collection(db, "users", uid, "habits"));
  await setDoc(ref, data);
  return { id: ref.id, ...data };
}

export async function getHabitLogs(uid: string, isMock: boolean): Promise<any[]> {
  if (isMock) {
    const key = MOCK_LOGS_KEY + uid;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  const snapshot = await getDocs(collection(db, "users", uid, "habitLogs"));
  return snapshot.docs.map(doc => doc.data());
}

export async function logHabitCompletion(
  uid: string, 
  isMock: boolean, 
  habitId: string, 
  date: string, 
  done: boolean
): Promise<any> {
  const logId = `${date}_${habitId}`;
  const data = {
    habitId,
    date,
    done,
    loggedAt: new Date().toISOString(),
  };

  if (isMock) {
    const key = MOCK_LOGS_KEY + uid;
    const logs = await getHabitLogs(uid, isMock);
    const filtered = logs.filter(l => !(l.habitId === habitId && l.date === date));
    localStorage.setItem(key, JSON.stringify([...filtered, data]));
    return data;
  }

  const ref = doc(db, "users", uid, "habitLogs", logId);
  await setDoc(ref, data);
  return data;
}

export function calculateHabitStreak(habitId: string, allLogs: any[]): number {
  const habitLogs = allLogs
    .filter((l: any) => l.habitId === habitId && l.done)
    .map((l: any) => l.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // sort desc

  if (habitLogs.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Check if habit is logged today or yesterday to continue streak
  if (habitLogs[0] !== todayStr && habitLogs[0] !== yesterdayStr) {
    return 0;
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

  return streak;
}

// Stats API
export async function getUserStats(uid: string, isMock: boolean): Promise<any> {
  if (isMock) {
    const key = MOCK_STATS_KEY + uid;
    const stored = localStorage.getItem(key);
    if (!stored) {
      const initial = {
        completedThisWeek: 1,
        totalCompleted: 1,
        onTimeCount: 1,
        lateCount: 0,
        currentStreak: 1,
        lastCompletedDate: new Date().toISOString().split("T")[0],
      };
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  }

  const ref = doc(db, "users", uid, "stats", "summary");
  const d = await getDoc(ref);
  if (!d.exists()) {
    const initial = {
      completedThisWeek: 0,
      totalCompleted: 0,
      onTimeCount: 0,
      lateCount: 0,
      currentStreak: 0,
      lastCompletedDate: "",
    };
    await setDoc(ref, initial);
    return initial;
  }
  return d.data();
}

export async function updateUserStats(uid: string, isMock: boolean, stats: any): Promise<any> {
  if (isMock) {
    const key = MOCK_STATS_KEY + uid;
    const existing = await getUserStats(uid, isMock);
    const merged = { ...existing, ...stats };
    localStorage.setItem(key, JSON.stringify(merged));
    return merged;
  }

  const ref = doc(db, "users", uid, "stats", "summary");
  await setDoc(ref, stats, { merge: true });
  return stats;
}

// Combined Complete Task & Update Stats
export async function completeTaskAndStats(uid: string, isMock: boolean, taskId: string, task: any) {
  const completedAt = new Date().toISOString();
  const isOnTime = new Date(completedAt) <= new Date(task.deadline);

  // Update task
  await updateTask(uid, isMock, taskId, {
    completed: true,
    completedAt,
    onTime: isOnTime,
  });

  // Update user stats
  const stats: any = await getUserStats(uid, isMock);
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

  await updateUserStats(uid, isMock, updatedStats);
  return { isOnTime, stats: updatedStats };
}

// Compute client-side insights
export async function getInsights(uid: string, isMock: boolean) {
  const stats = await getUserStats(uid, isMock);
  const tasks = await getUserTasks(uid, isMock);
  
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

  return {
    completedThisWeek: stats.completedThisWeek || 0,
    onTimeRate,
    currentStreak: stats.currentStreak || 0,
    totalActiveTasks: tasks.filter((t: any) => !t.completed).length,
    taskCompletionByDay,
  };
}

// Schedule Reminder
export async function createReminder(uid: string, isMock: boolean, reminderData: any) {
  const data = {
    ...reminderData,
    uid,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (isMock) {
    console.log("[MOCK REMINDER] Scheduled reminder for: ", data.taskTitle, "at", data.reminderTime);
    return { id: "rem_" + Math.random().toString(36).substr(2, 9), ...data };
  }

  const ref = doc(collection(db, "reminders"));
  await setDoc(ref, data);
  return { id: ref.id, ...data };
}
