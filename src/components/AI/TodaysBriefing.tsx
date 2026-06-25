import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface TodaysBriefingProps {
  tasks: any[];
  getBriefing: (tasks: any[]) => Promise<string>;
}

export default function TodaysBriefing({ tasks, getBriefing }: TodaysBriefingProps) {
  const [briefing, setBriefing] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [hasFetched, setHasFetched] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const activeTasks = tasks.filter((t) => !t.completed);
      const text = await getBriefing(activeTasks);
      setBriefing(text);
      sessionStorage.setItem("todays_coach_briefing", text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = sessionStorage.getItem("todays_coach_briefing");
    if (cached) {
      setBriefing(cached);
      setHasFetched(true);
      return;
    }

    if (tasks.length > 0 && !hasFetched) {
      fetchBriefing();
      setHasFetched(true);
    } else if (tasks.length === 0 && !hasFetched) {
      setBriefing("No active tasks found today. Add some tasks below and let's get organized to smash those deadlines!");
    }
  }, [tasks.length, hasFetched]);

  return (
    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 rounded-3xl p-6 shadow-sm relative overflow-hidden font-sans">
      {/* Visual background sparkles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2.5 rounded-2xl border border-blue-200/50 dark:border-blue-900/20 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-600/10 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-indigo-800/80 dark:text-indigo-300 font-display">
              TODAY'S COACH BRIEFING
            </h3>
            {loading ? (
              <div className="mt-2.5 space-y-2 w-full max-w-lg">
                <div className="h-3 bg-indigo-200/50 dark:bg-indigo-900/40 rounded-full animate-pulse w-full"></div>
                <div className="h-3 bg-indigo-200/50 dark:bg-indigo-900/40 rounded-full animate-pulse w-[92%]"></div>
                <div className="h-3 bg-indigo-200/50 dark:bg-indigo-900/40 rounded-full animate-pulse w-[75%]"></div>
              </div>
            ) : (
              <p className="mt-2 text-indigo-950 dark:text-slate-200 text-sm leading-relaxed max-w-3xl font-medium italic">
                "{briefing}"
              </p>
            )}
          </div>
        </div>

        <button
          onClick={fetchBriefing}
          disabled={loading}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-900/40 disabled:text-slate-400 transition-all duration-200 shadow-sm"
          title="Regenerate Briefing"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
