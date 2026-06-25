import React, { useState } from "react";
import { Flame, Plus, Check, Loader2, Sparkles, TrendingUp, CalendarDays } from "lucide-react";

interface HabitTrackerProps {
  habits: any[];
  streaks: any;
  loading: boolean;
  addHabit: (habitData: { name: string; frequency: "daily" | "weekly"; targetCount: number }) => Promise<any>;
  logHabit: (habitId: string, date: string, done: boolean) => Promise<any>;
}

export default function HabitTracker({ habits, streaks, loading, addHabit, logHabit }: HabitTrackerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [targetCount, setTargetCount] = useState(5);
  const [saving, setSaving] = useState(false);

  // Generate date strings for past 7 days: [YYYY-MM-DD, ...]
  const getPastSevenDays = () => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push({
        dateStr: d.toISOString().split("T")[0],
        dayName: d.toLocaleDateString([], { weekday: "narrow" }),
        dayNum: d.getDate(),
      });
    }
    return arr;
  };

  const pastDays = getPastSevenDays();

  // Keep a local toggle logs state to update UI instantly without full re-fetches
  const [loggedHabitDays, setLoggedHabitDays] = useState<any>({});

  const handleToggleDay = async (habitId: string, dateStr: string) => {
    const key = `${habitId}_${dateStr}`;
    const currentlyDone = loggedHabitDays[key] || false;
    const nextDone = !currentlyDone;

    // Instant local state transition
    setLoggedHabitDays((prev: any) => ({
      ...prev,
      [key]: nextDone,
    }));

    try {
      await logHabit(habitId, dateStr, nextDone);
    } catch (err) {
      console.error(err);
      // Revert if API failed
      setLoggedHabitDays((prev: any) => ({
        ...prev,
        [key]: currentlyDone,
      }));
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await addHabit({
        name,
        frequency,
        targetCount: Number(targetCount),
      });
      setName("");
      setFrequency("daily");
      setTargetCount(5);
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <span className="text-sm font-semibold">Gathering habit metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper header section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2 font-display">
            <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            AI-Coached Habit Builders
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Form high-impact positive routines to reinforce your focus blocks.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Add Habit
        </button>
      </div>

      {/* Habit grid layout */}
      {habits.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 max-w-lg">
          <p className="text-sm font-semibold mb-2 font-display">No Habits Established Yet</p>
          <p className="text-xs text-slate-500 mb-4 font-medium">Add routines like "Focus block for 25m" or "Review deadlines at 8 AM" to build active streaks.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            Create Your First Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {habits.map((habit) => {
            const streak = streaks[habit.id] || 0;
            
            // Calculate completed count in past 7 days from local logs
            const weeklyCompletions = pastDays.filter(
              (day) => loggedHabitDays[`${habit.id}_${day.dateStr}`]
            ).length;
            const progressPercent = Math.min(
              100,
              Math.round((weeklyCompletions / (habit.targetCount || 1)) * 100)
            );

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                        {habit.name}
                      </h4>
                      <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase font-display">
                        {habit.frequency} • Target: {habit.targetCount}x a week
                      </span>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold">
                      <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{streak}d Streak</span>
                    </div>
                  </div>

                  {/* 7 Days tracker row */}
                  <div className="mt-5 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                    <h5 className="text-[9px] font-extrabold tracking-widest uppercase text-slate-400 mb-3 font-display">
                      WEEKLY LOG (PAST 7 DAYS)
                    </h5>
                    
                    <div className="flex justify-between items-center gap-2 pt-1">
                      {pastDays.map((day) => {
                        const isDone = loggedHabitDays[`${habit.id}_${day.dateStr}`] || false;
                        return (
                          <button
                            key={day.dateStr}
                            onClick={() => handleToggleDay(habit.id, day.dateStr)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-2xl border flex-1 transition-all ${
                              isDone
                                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow shadow-blue-500/10"
                                : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/80 dark:hover:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                            title={`Toggle completion for ${day.dateStr}`}
                          >
                            <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-60">
                              {day.dayName}
                            </span>
                            <span className="text-xs font-extrabold leading-none">{day.dayNum}</span>
                            <div className={`mt-1.5 w-4 h-4 rounded-full flex items-center justify-center border ${
                              isDone ? "bg-white/20 border-transparent text-white" : "bg-transparent border-slate-300 dark:border-slate-800"
                            }`}>
                              {isDone && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Progress bar footer */}
                <div className="mt-5 border-t border-slate-100 dark:border-slate-800/40 pt-3.5 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Weekly Goal Progress</span>
                      <span className="font-bold">
                        {weeklyCompletions}/{habit.targetCount} days
                      </span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal Popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4 flex items-center gap-1.5 font-display">
              <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
              Initialize AI Habit Builder
            </h3>

            <form onSubmit={handleCreateHabit} className="space-y-4 font-medium">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-display">
                  Habit Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. 25-Min Study Blocks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-display">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all font-semibold"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-display">
                    Target days/week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow"
                >
                  {saving ? "Deploying..." : "Deploy Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
