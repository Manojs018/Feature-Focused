export function sortByUrgency(tasks: any[]): any[] {
  return [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;

    // Combined score: high score means more urgent
    // Score based on time diff and priority
    const now = new Date().getTime();
    const aTime = new Date(a.deadline).getTime();
    const bTime = new Date(b.deadline).getTime();

    const aDiff = aTime - now;
    const bDiff = bTime - now;

    // Priorities: High=3, Medium=2, Low=1
    const pMap: any = { High: 3, Medium: 2, Low: 1 };
    const aPriority = pMap[a.priority] || 1;
    const bPriority = pMap[b.priority] || 1;

    // Weight priority vs deadline diff
    // Tasks overdue are highly urgent
    const aOverdue = aDiff < 0;
    const bOverdue = bDiff < 0;

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // If both overdue or both future, rank by proximity and priority
    // Lower diff = more urgent. We add a bonus for priority
    // Proximity factor = 1e11 / abs(diff)
    const aScore = aPriority * 10 + (aOverdue ? 100 : 0) - (aDiff / (1000 * 60 * 60));
    const bScore = bPriority * 10 + (bOverdue ? 100 : 0) - (bDiff / (1000 * 60 * 60));

    return bScore - aScore; // highest score first (most urgent)
  });
}

export function getUrgencyColor(deadline: string, completed: boolean = false): { border: string; bg: string; text: string; badge: string } {
  if (completed) {
    return {
      border: "border-slate-100 dark:border-slate-800/40",
      bg: "bg-slate-50/60 dark:bg-slate-900/40 opacity-70",
      text: "text-slate-500 dark:text-slate-500",
      badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    };
  }

  const diff = new Date(deadline).getTime() - new Date().getTime();
  const hours = diff / (1000 * 60 * 60);

  if (diff < 0) {
    // Overdue
    return {
      border: "border-rose-200 dark:border-rose-900/30 shadow-sm",
      bg: "bg-white dark:bg-slate-900",
      text: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    };
  } else if (hours <= 24) {
    // Due today (within 24 hours)
    return {
      border: "border-amber-200 dark:border-amber-900/30",
      bg: "bg-white dark:bg-slate-900",
      text: "text-amber-700 dark:text-amber-400",
      badge: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    };
  } else if (hours <= 168) {
    // Due this week (within 7 days)
    return {
      border: "border-blue-100 dark:border-blue-900/20",
      bg: "bg-white dark:bg-slate-900",
      text: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    };
  } else {
    // Future
    return {
      border: "border-slate-200 dark:border-slate-800",
      bg: "bg-white dark:bg-slate-900",
      text: "text-slate-600 dark:text-slate-400",
      badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };
  }
}

export function mergePriorityScores(tasks: any[], scores: any[]): any[] {
  return tasks.map(task => {
    const aiInsight = scores.find(s => s.id === task.id);
    if (aiInsight) {
      return {
        ...task,
        priorityScore: aiInsight.priorityScore,
        tip: aiInsight.tip,
        suggestedTime: aiInsight.suggestedTime,
        estimatedMinutes: aiInsight.estimatedMinutes,
      };
    }
    return task;
  });
}
