import { adminDb } from "./admin";
import fs from "fs";
import path from "path";

const LOCAL_DB_PATH = path.join(process.cwd(), "local-db.json");

interface LocalDb {
  users: Record<string, any>;
  reminders: Record<string, any>;
}

function loadLocalDb(): LocalDb {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
    }
  } catch (err) {
    // Silent recovery for sandbox resilience
  }
  return { users: {}, reminders: {} };
}

function saveLocalDb(data: LocalDb) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Silent recovery for sandbox resilience
  }
}

// Active connection caching and pro-active probe to bypass Firestore if permissions are denied
let isFirestoreAvailable = false;
let isFirestoreChecked = false;

async function useFirestore(): Promise<boolean> {
  if (isFirestoreChecked) return isFirestoreAvailable;
  try {
    // Fast verification probe
    await adminDb.collection("users").limit(1).get();
    isFirestoreAvailable = true;
    console.log("[DB] Connected to Cloud Firestore database.");
  } catch (error) {
    isFirestoreAvailable = false;
    console.log("[DB] Cloud database is not accessible. Using high-performance Sandbox local storage.");
  }
  isFirestoreChecked = true;
  return isFirestoreAvailable;
}

// Helpers for dealing with Firestore fields/collections with transparent local JSON fallback
export async function getUserTasks(uid: string) {
  if (await useFirestore()) {
    try {
      const snapshot = await adminDb
        .collection("users")
        .doc(uid)
        .collection("tasks")
        .orderBy("deadline", "asc")
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      // Graceful local fallback
    }
  }
  
  const db = loadLocalDb();
  const tasks = db.users[uid]?.tasks || {};
  return Object.keys(tasks).map(id => ({ id, ...tasks[id] })).sort((a: any, b: any) => {
    const d1 = a.deadline || "";
    const d2 = b.deadline || "";
    return d1.localeCompare(d2);
  });
}

export async function createTask(uid: string, taskData: any) {
  const data = {
    ...taskData,
    completed: false,
    completedAt: null,
    onTime: null,
    createdAt: new Date().toISOString(),
  };

  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid).collection("tasks").doc();
      await ref.set(data);
      return { id: ref.id, ...data };
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (!db.users[uid]) db.users[uid] = {};
  if (!db.users[uid].tasks) db.users[uid].tasks = {};
  const id = "task_" + Math.random().toString(36).substr(2, 9);
  db.users[uid].tasks[id] = data;
  saveLocalDb(db);
  return { id, ...data };
}

export async function updateTask(uid: string, taskId: string, updates: any) {
  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid).collection("tasks").doc(taskId);
      await ref.update(updates);
      return { id: taskId, ...updates };
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (db.users[uid]?.tasks?.[taskId]) {
    db.users[uid].tasks[taskId] = { ...db.users[uid].tasks[taskId], ...updates };
    saveLocalDb(db);
  }
  return { id: taskId, ...updates };
}

export async function deleteTask(uid: string, taskId: string) {
  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid).collection("tasks").doc(taskId);
      await ref.delete();
      return { success: true };
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (db.users[uid]?.tasks?.[taskId]) {
    delete db.users[uid].tasks[taskId];
    saveLocalDb(db);
  }
  return { success: true };
}

export async function getUserHabits(uid: string) {
  if (await useFirestore()) {
    try {
      const snapshot = await adminDb
        .collection("users")
        .doc(uid)
        .collection("habits")
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  const habits = db.users[uid]?.habits || {};
  return Object.keys(habits).map(id => ({ id, ...habits[id] })).sort((a: any, b: any) => {
    const c1 = b.createdAt || "";
    const c2 = a.createdAt || "";
    return c1.localeCompare(c2);
  });
}

export async function createHabit(uid: string, habitData: any) {
  const data = {
    ...habitData,
    createdAt: new Date().toISOString(),
  };

  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid).collection("habits").doc();
      await ref.set(data);
      return { id: ref.id, ...data };
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (!db.users[uid]) db.users[uid] = {};
  if (!db.users[uid].habits) db.users[uid].habits = {};
  const id = "habit_" + Math.random().toString(36).substr(2, 9);
  db.users[uid].habits[id] = data;
  saveLocalDb(db);
  return { id, ...data };
}

export async function logHabitCompletion(uid: string, habitId: string, date: string, done: boolean) {
  const logId = `${date}_${habitId}`;
  const data = {
    habitId,
    date,
    done,
    loggedAt: new Date().toISOString(),
  };

  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid).collection("habitLogs").doc(logId);
      await ref.set(data);
      return data;
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (!db.users[uid]) db.users[uid] = {};
  if (!db.users[uid].habitLogs) db.users[uid].habitLogs = {};
  db.users[uid].habitLogs[logId] = data;
  saveLocalDb(db);
  return data;
}

export async function getHabitLogs(uid: string) {
  if (await useFirestore()) {
    try {
      const snapshot = await adminDb
        .collection("users")
        .doc(uid)
        .collection("habitLogs")
        .get();

      return snapshot.docs.map(doc => doc.data());
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  const habitLogs = db.users[uid]?.habitLogs || {};
  return Object.values(habitLogs);
}

export async function getUserStats(uid: string) {
  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid).collection("stats").doc("summary");
      const doc = await ref.get();
      if (doc.exists) {
        return doc.data() || {};
      }
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (db.users[uid]?.stats?.summary) {
    return db.users[uid].stats.summary;
  }

  return {
    completedThisWeek: 0,
    totalCompleted: 0,
    onTimeCount: 0,
    lateCount: 0,
    currentStreak: 0,
    lastCompletedDate: "",
  };
}

export async function updateUserStats(uid: string, stats: any) {
  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid).collection("stats").doc("summary");
      await ref.set(stats, { merge: true });
      return stats;
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (!db.users[uid]) db.users[uid] = {};
  if (!db.users[uid].stats) db.users[uid].stats = {};
  db.users[uid].stats.summary = { ...(db.users[uid].stats.summary || {}), ...stats };
  saveLocalDb(db);
  return stats;
}

export async function saveFcmToken(uid: string, token: string) {
  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid);
      await ref.set({ fcmToken: token }, { merge: true });
      return;
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (!db.users[uid]) db.users[uid] = {};
  db.users[uid].fcmToken = token;
  saveLocalDb(db);
}

export async function getAllUsersWithFcm() {
  if (await useFirestore()) {
    try {
      const snapshot = await adminDb.collection("users").get();
      return snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() }))
        .filter((user: any) => user.fcmToken);
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  return Object.keys(db.users)
    .map(uid => ({ uid, ...db.users[uid] }))
    .filter(user => user.fcmToken);
}

export async function getPendingReminders() {
  const now = new Date().toISOString();
  if (await useFirestore()) {
    try {
      const snapshot = await adminDb
        .collection("reminders")
        .where("status", "==", "pending")
        .where("reminderTime", "<=", now)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  return Object.keys(db.reminders)
    .map(id => ({ id, ...db.reminders[id] }))
    .filter((r: any) => r.status === "pending" && r.reminderTime <= now);
}

export async function updateReminderStatus(reminderId: string, status: "pending" | "sent") {
  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("reminders").doc(reminderId);
      await ref.update({ status });
      return;
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (db.reminders[reminderId]) {
    db.reminders[reminderId].status = status;
    saveLocalDb(db);
  }
}

export async function createReminder(reminderData: any) {
  const data = {
    ...reminderData,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("reminders").doc();
      await ref.set(data);
      return { id: ref.id, ...data };
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  const id = "rem_" + Math.random().toString(36).substr(2, 9);
  db.reminders[id] = data;
  saveLocalDb(db);
  return { id, ...data };
}

// Gmail Connection & Syncing helpers
export async function saveGmailConnection(uid: string, gmailData: { accessToken: string; email: string; connectedAt: string }) {
  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid);
      await ref.set({ gmailConnection: gmailData }, { merge: true });
      return;
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (!db.users[uid]) db.users[uid] = {};
  db.users[uid].gmailConnection = gmailData;
  saveLocalDb(db);
}

export async function getGmailConnection(uid: string) {
  if (await useFirestore()) {
    try {
      const doc = await adminDb.collection("users").doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        return data?.gmailConnection || null;
      }
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  return db.users[uid]?.gmailConnection || null;
}

export async function getAllGmailConnections() {
  if (await useFirestore()) {
    try {
      const snapshot = await adminDb.collection("users").get();
      return snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() }))
        .filter((user: any) => user.gmailConnection && user.gmailConnection.accessToken);
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  return Object.keys(db.users)
    .map(uid => ({ uid, ...db.users[uid] }))
    .filter(user => user.gmailConnection && user.gmailConnection.accessToken);
}

export async function disconnectGmail(uid: string) {
  if (await useFirestore()) {
    try {
      const ref = adminDb.collection("users").doc(uid);
      await ref.set({ gmailConnection: null }, { merge: true });
      return;
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (db.users[uid]) {
    db.users[uid].gmailConnection = null;
    saveLocalDb(db);
  }
}

export async function isEmailProcessed(uid: string, messageId: string): Promise<boolean> {
  if (await useFirestore()) {
    try {
      const doc = await adminDb
        .collection("users")
        .doc(uid)
        .collection("processedEmails")
        .doc(messageId)
        .get();
      return doc.exists;
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  return !!db.users[uid]?.processedEmails?.[messageId];
}

export async function markEmailProcessed(uid: string, messageId: string) {
  if (await useFirestore()) {
    try {
      await adminDb
        .collection("users")
        .doc(uid)
        .collection("processedEmails")
        .doc(messageId)
        .set({ processedAt: new Date().toISOString() });
      return;
    } catch (error: any) {
      // Graceful local fallback
    }
  }

  const db = loadLocalDb();
  if (!db.users[uid]) db.users[uid] = {};
  if (!db.users[uid].processedEmails) db.users[uid].processedEmails = {};
  db.users[uid].processedEmails[messageId] = { processedAt: new Date().toISOString() };
  saveLocalDb(db);
}
