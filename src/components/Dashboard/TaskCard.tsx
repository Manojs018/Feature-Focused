import React, { useState } from "react";
import { CheckCircle2, Trash2, ShieldAlert, Sparkles, AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { formatDeadline, getCountdown } from "../../utils/dateHelpers";
import { getUrgencyColor } from "../../utils/taskHelpers";

interface TaskCardProps {
  key?: any;
  task: any;
  onComplete: (taskId: string) => Promise<any>;
  onDelete: (taskId: string) => Promise<any>;
  breakdownTask: (task: any) => Promise<string[]>;
}

export default function TaskCard({ task, onComplete, onDelete, breakdownTask }: TaskCardProps) {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [subtaskChecked, setSubtaskChecked] = useState<boolean[]>([]);

  const urgencyColors = getUrgencyColor(task.deadline, task.completed);
  const countdownText = getCountdown(task.deadline);

  const isWithinTwoHours = (() => {
    if (task.completed || !task.deadline) return false;
    const diff = new Date(task.deadline).getTime() - new Date().getTime();
    return diff > 0 && diff <= 2 * 60 * 60 * 1000;
  })();

  const handleBreakdownClick = async () => {
    if (showSubtasks) {
      setShowSubtasks(false);
      return;
    }

    if (subtasks.length > 0) {
      setShowSubtasks(true);
      return;
    }

    setLoadingSubtasks(true);
    setShowSubtasks(true);
    try {
      const result = await breakdownTask(task);
      setSubtasks(result);
      setSubtaskChecked(new Array(result.length).fill(false));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  const handleSubtaskToggle = (idx: number) => {
    const updated = [...subtaskChecked];
    updated[idx] = !updated[idx];
    setSubtaskChecked(updated);
  };

  return (
    <div
      className={`border rounded-3xl p-6 ${
        isWithinTwoHours
          ? "border-rose-400 dark:border-rose-700/60 bg-rose-50/10 dark:bg-rose-950/5 ring-1 ring-rose-400/20 shadow-sm"
          : `${urgencyColors.border} ${urgencyColors.bg}`
      } transition-all duration-200 hover:shadow-md flex flex-col justify-between h-full font-sans`}
    >
      <div>
        {/* Badges/Context row */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${urgencyColors.badge} font-display`}>
              {task.category}
            </span>
            <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-xl font-display uppercase tracking-wider ${
              task.priority === "High"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                : task.priority === "Medium"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-400"
            }`}>
              {task.priority} Priority
            </span>
            {task.cognitiveType && (
              <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-xl font-display uppercase tracking-wider ${
                task.cognitiveType === "Deep Work"
                  ? "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200/30"
                  : task.cognitiveType === "Admin Work"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/30"
                  : task.cognitiveType === "Creative Session"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/30"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30"
              }`}>
                ⚡ {task.cognitiveType}
              </span>
            )}
            {isWithinTwoHours && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider bg-rose-600 text-white dark:bg-rose-700 animate-pulse font-display shadow-sm">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Warning: Due Soon
              </span>
            )}
          </div>

          {!task.completed && (
            <span className={`text-xs font-bold font-mono tracking-wide ${isWithinTwoHours ? "text-rose-600 dark:text-rose-400" : urgencyColors.text}`}>
              {countdownText}
            </span>
          )}
        </div>

        {/* Task Title */}
        <h4 className={`text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug font-display ${task.completed ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
          {task.title}
        </h4>
        
        {task.description && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
            {task.description}
          </p>
        )}

        <div className="mt-4 border-t border-slate-100 dark:border-slate-800/40 pt-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="font-semibold text-slate-400">Deadline: </span>
            {formatDeadline(task.deadline)}
          </div>
        </div>

        {/* AI Priority details if available */}
        {!task.completed && (task.priorityScore || task.tip) && (
          <div className="mt-4 bg-blue-50/50 dark:bg-blue-950/25 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[9px] font-extrabold tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1 uppercase font-display">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                AI URGENCY SCORE
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-blue-100/60 dark:bg-blue-950 text-blue-800 dark:text-blue-400 rounded-lg font-mono">
                {task.priorityScore || (task.priority === "High" ? 9 : task.priority === "Medium" ? 6 : 3)}/10
              </span>
            </div>
            {task.tip && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed font-medium">
                "{task.tip}"
              </p>
            )}
            {task.suggestedTime && (
              <div className="mt-2 text-[9px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest font-display">
                ★ Suggested Focus: {task.suggestedTime}
              </div>
            )}
          </div>
        )}

        {/* Expandable Subtask List */}
        {showSubtasks && (
          <div className="mt-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4">
            <h5 className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase mb-3 font-display">
              AI STEPS BREAKDOWN
            </h5>

            {loadingSubtasks ? (
              <div className="flex items-center gap-2 py-2 justify-center text-xs text-slate-400 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Planning steps...
              </div>
            ) : (
              <div className="space-y-2">
                {subtasks.map((step, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-2.5 p-2 rounded-xl text-xs leading-relaxed transition-all cursor-pointer ${
                      subtaskChecked[idx]
                        ? "bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 line-through"
                        : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={subtaskChecked[idx]}
                      onChange={() => handleSubtaskToggle(idx)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-800 w-3.5 h-3.5"
                    />
                    <span>{step}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buttons Row */}
      <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/40 pt-4">
        {!task.completed ? (
          <>
            <button
              onClick={() => onComplete(task.id)}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-600/15"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete
            </button>

            <button
              onClick={handleBreakdownClick}
              className="flex items-center gap-1 text-xs font-bold px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-all border border-slate-100 dark:border-slate-800"
            >
              Steps
              {showSubtasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </>
        ) : (
          <span className="text-xs font-extrabold text-emerald-500 flex items-center gap-1 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
            ✓ Done {task.onTime ? "On-Time" : "Late"}
          </span>
        )}

        <button
          onClick={() => onDelete(task.id)}
          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all border border-transparent"
          title="Delete Task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
