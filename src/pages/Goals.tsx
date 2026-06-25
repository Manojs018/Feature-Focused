import React from "react";
import HabitTracker from "../components/Goals/HabitTracker";
import { Sparkles, Bot, CalendarRange } from "lucide-react";

interface GoalsProps {
  habits: any[];
  streaks: any;
  loading: boolean;
  addHabit: (habitData: any) => Promise<any>;
  logHabit: (habitId: string, date: string, done: boolean) => Promise<any>;
}

export default function Goals({ habits, streaks, loading, addHabit, logHabit }: GoalsProps) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <CalendarRange className="w-7 h-7 text-rose-500" />
          Habit Routine Builders
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Configure daily or weekly habits to support your productivity and beat deadlines consistently.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit tracker grid */}
        <div className="lg:col-span-2">
          <HabitTracker
            habits={habits}
            streaks={streaks}
            loading={loading}
            addHabit={addHabit}
            logHabit={logHabit}
          />
        </div>

        {/* Right sidebar: AI coaching tip cards */}
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-300">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-3">
              <Bot className="w-5 h-5 text-rose-500" />
              AI Habit Insights
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Building standard routine focus habits helps bypass the "decision friction" that leads to last-minute panic.
            </p>
            
            <div className="space-y-3.5 pt-2 border-t border-slate-850">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  The Pomodoro Routine
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Start with a "3x Pomodoro study block" habit. Focus 100% for 25 mins, then take a short 5 min stretch.
                </p>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                  Morning Deadline Scan
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Log a daily "Scanned deadlines at 8 AM" habit to avoid any surprise exams, projects, or meetings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
