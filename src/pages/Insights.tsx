import React, { useState, useEffect } from "react";
import StatsPanel from "../components/Insights/StatsPanel";
import WeeklyChart from "../components/Insights/WeeklyChart";
import { BarChart3, Loader2 } from "lucide-react";
import { getInsights, getUserTasks, getUserHabits, getHabitLogs } from "../utils/firebaseDb";

interface InsightsProps {
  getAuthToken: () => Promise<string>;
  user: any;
  getWeeklyInsights: (tasks: any[], habits: any[], logs: any[]) => Promise<string>;
}

export default function Insights({ getAuthToken, user, getWeeklyInsights }: InsightsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.uid;
  const isMock = !!user?.isMock;

  const fetchStats = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getInsights(userId, isMock);
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const handleGetWeeklyInsights = async () => {
    if (!userId) return "";
    const tasks = await getUserTasks(userId, isMock);
    const habits = await getUserHabits(userId, isMock);
    const logs = await getHabitLogs(userId, isMock);
    return await getWeeklyInsights(tasks, habits, logs);
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-3" />
        <span className="text-sm font-semibold">Running database computations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-rose-500" />
          Productivity Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Detailed metrics tracking your velocity and on-time task execution.
        </p>
      </div>

      {/* Stats Cards & AI Review */}
      <StatsPanel
        stats={stats}
        getWeeklyInsights={handleGetWeeklyInsights}
      />

      {/* Weekly Velocity Recharts Visualizer */}
      <WeeklyChart
        data={stats.taskCompletionByDay || []}
        onTimeRate={stats.onTimeRate || 0}
      />
    </div>
  );
}
