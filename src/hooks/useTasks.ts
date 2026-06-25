import { useState, useEffect } from "react";
import * as db from "../utils/firebaseDb";

export function useTasks(getAuthToken: () => Promise<string>, user: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.uid;
  const isMock = !!user?.isMock;

  const fetchTasks = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await db.getUserTasks(userId, isMock);
      setTasks(data);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const addTask = async (taskData: {
    title: string;
    description?: string;
    deadline: string;
    priority: "High" | "Medium" | "Low";
    category: "Work" | "Study" | "Personal" | "Finance";
  }) => {
    try {
      if (!userId) throw new Error("No user logged in");
      const newTask = await db.createTask(userId, isMock, taskData);
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (err: any) {
      console.error("Error adding task:", err);
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: any) => {
    try {
      if (!userId) throw new Error("No user logged in");
      const updated = await db.updateTask(userId, isMock, taskId, updates);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      );
      return updated;
    } catch (err: any) {
      console.error("Error updating task:", err);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      if (!userId) throw new Error("No user logged in");
      await db.deleteTask(userId, isMock, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      console.error("Error deleting task:", err);
      throw err;
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      if (!userId) throw new Error("No user logged in");
      const targetTask = tasks.find(t => t.id === taskId);
      if (!targetTask) throw new Error("Task not found");
      
      const res = await db.completeTaskAndStats(userId, isMock, taskId, targetTask);
      
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, completed: true, completedAt: new Date().toISOString(), onTime: res.isOnTime }
            : t
        )
      );
      return res;
    } catch (err: any) {
      console.error("Error completing task:", err);
      throw err;
    }
  };

  return {
    tasks,
    setTasks,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
  };
}
