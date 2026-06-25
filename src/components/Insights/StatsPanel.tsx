import React, { useState } from "react";
import { CheckSquare, Calendar, Sparkles, Flame, Loader2, Award, Zap } from "lucide-react";

interface StatsPanelProps {
  stats: {
    completedThisWeek: number;
    onTimeRate: number;
    currentStreak: number;
    totalActiveTasks: number;
  };
  getWeeklyInsights: () => Promise<string>;
}

export default function StatsPanel({ stats, getWeeklyInsights }: StatsPanelProps) {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchInsights = async () => {
    setLoading(true);
    try {
      const result = await getWeeklyInsights();
      setInsights(result);
    } catch (err) {
      console.error(err);
      setInsights("Unable to fetch weekly AI analysis at this moment.");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Completed This Week",
      value: stats.completedThisWeek,
      icon: CheckSquare,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "On-Time Deadline Rate",
      value: `${stats.onTimeRate}%`,
      icon: Zap,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
    },
    {
      title: "Active Daily Streak",
      value: `${stats.currentStreak} days`,
      icon: Flame,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20",
    },
    {
      title: "Active Pending Tasks",
      value: stats.totalActiveTasks,
      icon: Calendar,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className={`p-3.5 rounded-2xl ${card.color} flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1 font-display">
                  {card.title}
                </span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Review Banner Button & Content block */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-blue-900/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-indigo-900/30 pb-5 mb-5 relative z-10">
          <div className="flex gap-4">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex-shrink-0 self-start">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider uppercase text-blue-300 font-display">
                AI Proactive Weekly Review
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                Unlock high-level behavioral recommendations and pattern highlights analyzed by Gemini.
              </p>
            </div>
          </div>

          <button
            onClick={handleFetchInsights}
            disabled={loading}
            className="w-full md:w-auto px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-850 disabled:text-slate-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Metrics...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Review
              </>
            )}
          </button>
        </div>

        {/* Gemini response text panel */}
        {insights ? (
          <div className="bg-slate-950/40 rounded-2xl p-5 border border-indigo-900/40 text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap animate-fadeIn max-h-[400px] overflow-y-auto relative z-10">
            {insights}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-6 text-xs text-slate-500 font-semibold italic relative z-10">
              Click the "Generate Review" button to prompt your coach and reveal customized insights.
            </div>
          )
        )}
      </div>
    </div>
  );
}
