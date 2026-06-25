import React, { useState, useEffect } from "react";
import { Play, CheckCircle2, Clock, ListTodo, Sparkles, ChevronRight } from "lucide-react";
import { getCountdown, formatDeadline } from "../../utils/dateHelpers";
import FocusSoundGenerator from "./FocusSoundGenerator";

interface FocusModeBannerProps {
  urgentTask: any;
  breakdownTask: (task: any) => Promise<string[]>;
  onCompleteTask: (taskId: string) => Promise<void>;
}

export default function FocusModeBanner({ urgentTask, breakdownTask, onCompleteTask }: FocusModeBannerProps) {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskChecked, setSubtaskChecked] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes Pomodoro
  const [liveDeadlineCountdown, setLiveDeadlineCountdown] = useState("");

  // Live countdown to deadline
  useEffect(() => {
    if (!urgentTask) return;
    setLiveDeadlineCountdown(getCountdown(urgentTask.deadline));
    const interval = setInterval(() => {
      setLiveDeadlineCountdown(getCountdown(urgentTask.deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [urgentTask]);

  // Pomodoro Live timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Load subtasks breakdown from Gemini on task change
  useEffect(() => {
    if (!urgentTask) {
      setSubtasks([]);
      return;
    }

    const loadBreakdown = async () => {
      setLoading(true);
      try {
        const list = await breakdownTask(urgentTask);
        setSubtasks(list);
        setSubtaskChecked(new Array(list.length).fill(false));
      } catch (err) {
        console.error("Subtasks load failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadBreakdown();
    setTimerActive(false);
    setTimeLeft(25 * 60);
  }, [urgentTask?.id]);

  if (!urgentTask) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        <p className="text-sm font-medium">All clear! No pending tasks right now. Create a task to kickstart your productivity.</p>
      </div>
    );
  }

  const handleToggleSubtask = (index: number) => {
    const updated = [...subtaskChecked];
    updated[index] = !updated[index];
    setSubtaskChecked(updated);
  };

  const handleStartTimer = () => {
    setTimerActive(true);
  };

  const handlePauseTimer = () => {
    setTimerActive(false);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = subtasks.length > 0 
    ? Math.round((subtaskChecked.filter(Boolean).length / subtasks.length) * 100) 
    : 0;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-3xl p-8 text-white relative shadow-xl shadow-blue-500/10 dark:shadow-indigo-950/40 overflow-hidden font-sans border border-blue-500/10">
      {/* Decorative subtle background circle */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl pointer-events-none"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Side: Task Info & Countdown */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="px-3.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-white/20 border border-white/10 text-white rounded-full">
                ACTIVE FOCUS SESSION
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/5 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {liveDeadlineCountdown}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl font-display">
              {urgentTask.title}
            </h2>
            {urgentTask.description && (
              <p className="mt-3 text-sm text-blue-100 leading-relaxed max-w-xl">
                {urgentTask.description}
              </p>
            )}
          </div>

          {/* Subtasks listing */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-xs font-bold tracking-widest uppercase text-blue-200/80 flex items-center gap-2 mb-4 font-display">
              <ListTodo className="w-4 h-4 text-blue-200" />
              AI STEP-BY-STEP PLAN
            </h3>

            {loading ? (
              <div className="space-y-2.5">
                <div className="h-4 bg-white/10 rounded-lg animate-pulse w-3/4"></div>
                <div className="h-4 bg-white/10 rounded-lg animate-pulse w-5/6"></div>
                <div className="h-4 bg-white/10 rounded-lg animate-pulse w-2/3"></div>
              </div>
            ) : subtasks.length > 0 ? (
              <div className="space-y-2.5">
                {subtasks.map((sub, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                      subtaskChecked[idx]
                        ? "bg-white/5 border-white/5 text-blue-200/50 line-through"
                        : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={subtaskChecked[idx]}
                      onChange={() => handleToggleSubtask(idx)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-white/20 border-white/30 w-4 h-4"
                    />
                    <span className="text-xs font-medium leading-relaxed">{sub}</span>
                  </label>
                ))}

                {/* Checklist Progress Bar */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex-1 bg-white/15 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-200">{progressPercent}% Done</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-blue-200/60">No subtasks generated.</p>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Focus Controls & Pomodoro Timer */}
        <div className="lg:col-span-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <h4 className="text-xs font-bold tracking-wider uppercase text-blue-200 mb-4 font-display">
              POMODORO CONTROLLER
            </h4>
            
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all ${timerActive ? "border-emerald-400 animate-pulse" : "border-white/10"}`}>
                <span className="text-3xl font-bold font-mono text-white tracking-wider">
                  {formatTimer(timeLeft)}
                </span>
                <span className="text-[9px] font-semibold text-blue-200 tracking-widest uppercase mt-1">
                  {timerActive ? "WORKING" : "PAUSED"}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 w-full max-w-xs mx-auto">
              {timerActive ? (
                <button
                  onClick={handlePauseTimer}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-all font-medium text-xs border border-transparent"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={handleStartTimer}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white text-blue-700 hover:bg-blue-50 transition-all font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-black/10"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start Focus
                </button>
              )}
              <button
                onClick={() => {
                  setTimerActive(false);
                  setTimeLeft(25 * 60);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all text-xs border border-transparent"
              >
                Reset
              </button>
            </div>

            {/* Procedural focus sound board */}
            <FocusSoundGenerator />
          </div>

          <button
            onClick={() => onCompleteTask(urgentTask.id)}
            className="w-full mt-8 py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            MARK TASK AS COMPLETE
          </button>
        </div>

      </div>
    </div>
  );
}
