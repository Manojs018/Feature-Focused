import { adminDb } from "./admin";

// Helpers for dealing with Firestore fields/collections
export async function getUserTasks(uid: string) {
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
}

export async function createTask(uid: string, taskData: any) {
  const ref = adminDb.collection("users").doc(uid).collection("tasks").doc();
  const data = {
    ...taskData,
    completed: false,
    completedAt: null,
    onTime: null,
    createdAt: new Date().toISOString(),
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

export async function updateTask(uid: string, taskId: string, updates: any) {
  const ref = adminDb.collection("users").doc(uid).collection("tasks").doc(taskId);
  await ref.update(updates);
  return { id: taskId, ...updates };
}

export async function deleteTask(uid: string, taskId: string) {
  const ref = adminDb.collection("users").doc(uid).collection("tasks").doc(taskId);
  await ref.delete();
  return { success: true };
}

export async function getUserHabits(uid: string) {
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
}

export async function createHabit(uid: string, habitData: any) {
  const ref = adminDb.collection("users").doc(uid).collection("habits").doc();
  const data = {
    ...habitData,
    createdAt: new Date().toISOString(),
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

export async function logHabitCompletion(uid: string, habitId: string, date: string, done: boolean) {
  const logId = `${date}_${habitId}`;
  const ref = adminDb.collection("users").doc(uid).collection("habitLogs").doc(logId);
  
  if (done) {
    const data = {
      habitId,
      date,
      done: true,
      loggedAt: new Date().toISOString(),
    };
    await ref.set(data);
    return data;
  } else {
    // If not done, we can delete the log or write done: false
    await ref.set({
      habitId,
      date,
      done: false,
      loggedAt: new Date().toISOString(),
    });
    return { habitId, date, done: false };
  }
}

export async function getHabitLogs(uid: string) {
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("habitLogs")
    .get();

  return snapshot.docs.map(doc => doc.data());
}

export async function getUserStats(uid: string) {
  const ref = adminDb.collection("users").doc(uid).collection("stats").doc("summary");
  const doc = await ref.get();
  
  if (!doc.exists) {
    // Default initial stats
    const initial = {
      completedThisWeek: 0,
      totalCompleted: 0,
      onTimeCount: 0,
      lateCount: 0,
      currentStreak: 0,
      lastCompletedDate: "",
    };
    await ref.set(initial);
    return initial;
  }
  
  return doc.data() || {};
}

export async function updateUserStats(uid: string, stats: any) {
  const ref = adminDb.collection("users").doc(uid).collection("stats").doc("summary");
  await ref.set(stats, { merge: true });
  return stats;
}

export async function saveFcmToken(uid: string, token: string) {
  const ref = adminDb.collection("users").doc(uid);
  await ref.set({ fcmToken: token }, { merge: true });
}

export async function getAllUsersWithFcm() {
  const snapshot = await adminDb.collection("users").get();
  return snapshot.docs
    .map(doc => ({ uid: doc.id, ...doc.data() }))
    .filter((user: any) => user.fcmToken);
}

export async function getPendingReminders() {
  const now = new Date().toISOString();
  const snapshot = await adminDb
    .collection("reminders")
    .where("status", "==", "pending")
    .where("reminderTime", "<=", now)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function updateReminderStatus(reminderId: string, status: "pending" | "sent") {
  const ref = adminDb.collection("reminders").doc(reminderId);
  await ref.update({ status });
}

export async function createReminder(reminderData: any) {
  const ref = adminDb.collection("reminders").doc();
  const data = {
    ...reminderData,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}
