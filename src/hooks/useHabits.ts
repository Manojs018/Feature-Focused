import { useState, useEffect } from "react";
import * as db from "../utils/firebaseDb";

export function useHabits(getAuthToken: () => Promise<string>, user: any) {
  const [habits, setHabits] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.uid;
  const isMock = !!user?.isMock;

  const fetchHabitsAndStreaks = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const habitsList = await db.getUserHabits(userId, isMock);
      setHabits(habitsList);

      const logs = await db.getHabitLogs(userId, isMock);
      const streaksObj: any = {};
      for (const h of habitsList) {
        streaksObj[h.id] = db.calculateHabitStreak(h.id, logs);
      }
      setStreaks(streaksObj);
    } catch (err: any) {
      console.error("Error fetching habits:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitsAndStreaks();
  }, [userId]);

  const addHabit = async (habitData: {
    name: string;
    frequency: "daily" | "weekly";
    targetCount: number;
  }) => {
    try {
      if (!userId) throw new Error("No user logged in");
      const newHabit = await db.createHabit(userId, isMock, habitData);
      setHabits((prev) => [newHabit, ...prev]);
      setStreaks((prev: any) => ({ ...prev, [newHabit.id]: 0 }));
      return newHabit;
    } catch (err) {
      console.error("Error adding habit:", err);
      throw err;
    }
  };

  const logHabit = async (habitId: string, date: string, done: boolean) => {
    try {
      if (!userId) throw new Error("No user logged in");
      await db.logHabitCompletion(userId, isMock, habitId, date, done);
      
      const logs = await db.getHabitLogs(userId, isMock);
      const updatedStreak = db.calculateHabitStreak(habitId, logs);
      setStreaks((prev: any) => ({
        ...prev,
        [habitId]: updatedStreak,
      }));
    } catch (err) {
      console.error("Error logging habit:", err);
      throw err;
    }
  };

  return {
    habits,
    streaks,
    loading,
    error,
    addHabit,
    logHabit,
    fetchHabits: fetchHabitsAndStreaks,
  };
}
