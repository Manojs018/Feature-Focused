export function isToday(isoString: string): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isDueThisWeek(isoString: string): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  return d > now && d <= nextWeek;
}

export function isOverdue(isoString: string): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const now = new Date();
  return d < now;
}

export function formatDeadline(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
  if (isToday(isoString)) {
    return `Today at ${timeStr}`;
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  ) {
    return `Tomorrow at ${timeStr}`;
  }

  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} at ${timeStr}`;
}

export function getCountdown(isoString: string): string {
  if (!isoString) return "";
  const diff = new Date(isoString).getTime() - new Date().getTime();
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (isPast) {
    if (days > 0) return `Overdue by ${days}d ${hours}h`;
    if (hours > 0) return `Overdue by ${hours}h ${minutes}m`;
    return `Overdue by ${minutes}m`;
  } else {
    if (days > 0) return `Due in ${days}d ${hours}h`;
    if (hours > 0) return `Due in ${hours}h ${minutes}m`;
    return `Due in ${minutes}m`;
  }
}
