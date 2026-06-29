import React, { useMemo } from "react";
import { motion } from "motion/react";
import { CheckCircle, Award, Target, Flame } from "lucide-react";

interface DailyProgressRingProps {
  tasks: any[];
}

export default function DailyProgressRing({ tasks }: DailyProgressRingProps) {
  // 1. Calculate tasks completed today and total tasks for today
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();

    const completedToday = tasks.filter((task) => {
      if (!task.completed) return false;
      if (!task.completedAt) return false;
      return new Date(task.completedAt).toDateString() === todayStr;
    });

    const activeDueToday = tasks.filter((task) => {
      if (task.completed) return false;
      if (!task.deadline) return false;
      return new Date(task.deadline).toDateString() === todayStr;
    });

    const completedCount = completedToday.length;
    const activeDueCount = activeDueToday.length;
    const totalToday = completedCount + activeDueCount;
    const percentage = totalToday > 0 ? Math.round((completedCount / totalToday) * 100) : 0;

    return {
      completedCount,
      totalToday,
      percentage,
      activeDueCount,
    };
  }, [tasks]);

  const { completedCount, totalToday, percentage } = stats;

  // 2. SVG Circle Configuration
  const radius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  // Calculate stroke-dashoffset: fully empty = circumference, fully full = 0
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // 3. Dynamic Motivational Message & Styling Elements
  const feedback = useMemo(() => {
    if (totalToday === 0) {
      return {
        message: "No tasks scheduled for today.",
        subtitle: "Add a task with today's deadline to track your daily progress!",
        colorClass: "text-slate-500 dark:text-slate-400",
        bgClass: "from-slate-500/10 to-slate-500/5",
        icon: <Target className="w-5 h-5 text-slate-500" />,
      };
    }
    if (percentage === 100) {
      return {
        message: "Perfect day! Outstanding job!",
        subtitle: "You've successfully cleared all active priorities scheduled for today.",
        colorClass: "text-emerald-600 dark:text-emerald-400",
        bgClass: "from-emerald-500/10 to-emerald-500/5",
        icon: <Award className="w-5 h-5 text-emerald-500 animate-bounce" />,
      };
    }
    if (percentage >= 75) {
      return {
        message: "Almost there! Keep going!",
        subtitle: "Just a final push to completely clear today's scheduled focus areas.",
        colorClass: "text-indigo-600 dark:text-indigo-400",
        bgClass: "from-indigo-500/10 to-indigo-500/5",
        icon: <Flame className="w-5 h-5 text-indigo-500 animate-pulse" />,
      };
    }
    if (percentage >= 40) {
      return {
        message: "Steady momentum!",
        subtitle: "Great steady progress. You are well on your way to a highly productive day.",
        colorClass: "text-blue-600 dark:text-blue-400",
        bgClass: "from-blue-500/10 to-blue-500/5",
        icon: <CheckCircle className="w-5 h-5 text-blue-500" />,
      };
    }
    if (percentage > 0) {
      return {
        message: "First steps taken!",
        subtitle: "The momentum is building. Keep tackling your action items to raise the bar.",
        colorClass: "text-sky-600 dark:text-sky-400",
        bgClass: "from-sky-500/10 to-sky-500/5",
        icon: <CheckCircle className="w-5 h-5 text-sky-400" />,
      };
    }
    return {
      message: "Ready to start today?",
      subtitle: "Complete your first task of the day to trigger your progress ring momentum!",
      colorClass: "text-slate-500 dark:text-slate-400",
      bgClass: "from-indigo-500/5 to-indigo-500/0",
      icon: <Target className="w-5 h-5 text-indigo-400" />,
    };
  }, [percentage, totalToday]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between h-full relative overflow-hidden font-sans">
      {/* Background radial accent glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r ${feedback.bgClass} rounded-full filter blur-3xl pointer-events-none transition-all duration-500`}></div>

      {/* Title Header */}
      <div className="w-full text-center pb-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-center gap-2">
        {feedback.icon}
        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 font-display">
          Daily Progress Ring
        </h3>
      </div>

      {/* SVG Progress Circle */}
      <div className="relative w-40 h-40 flex items-center justify-center my-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Track/Background circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800/60"
          />
          {/* Animated active progress circle */}
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            strokeLinecap="round"
            filter="url(#glow)"
          />
        </svg>

        {/* Center label with dynamic progress percentage */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-display"
          >
            {percentage}%
          </motion.span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 mt-0.5">
            Done
          </span>
        </div>
      </div>

      {/* Metrics & Context info block */}
      <div className="w-full text-center space-y-1.5 z-10">
        <p className={`text-xs font-extrabold ${feedback.colorClass} tracking-wide font-display uppercase`}>
          {feedback.message}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal px-2">
          {feedback.subtitle}
        </p>
        
        {totalToday > 0 && (
          <div className="pt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 font-mono text-[11px]">
              {completedCount}
            </span>
            <span className="text-slate-400">/</span>
            <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 font-mono text-[11px]">
              {totalToday}
            </span>
            <span className="text-slate-400 text-[11px]">Tasks</span>
          </div>
        )}
      </div>
    </div>
  );
}
