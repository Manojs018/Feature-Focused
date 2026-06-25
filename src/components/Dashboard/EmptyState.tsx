import React from "react";
import { ClipboardList, Plus, Sparkles, CheckCircle2 } from "lucide-react";

interface EmptyStateProps {
  onCreateTask: () => void;
}

export default function EmptyState({ onCreateTask }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800/80 rounded-3xl shadow-sm max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <ClipboardList className="w-8 h-8" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-white dark:border-slate-950">
          <Sparkles className="w-3 h-3 fill-blue-600/10 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display tracking-tight">
          Your Workspace is Clear!
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          No tasks found. This is your chance to plan ahead, set goals, and crush deadlines with proactive time blocks and subtask breakdown guides.
        </p>
      </div>

      <button
        onClick={onCreateTask}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        Create Your First Task
      </button>

      <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 w-full flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          AI Priority Scores
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          Task Breakdowns
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          Coach Briefings
        </span>
      </div>
    </div>
  );
}
