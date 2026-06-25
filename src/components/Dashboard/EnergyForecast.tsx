import React, { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Brain, Zap, Clock, BatteryCharging, AlertTriangle, HelpCircle, Plus } from "lucide-react";

interface Task {
  id: string;
  title: string;
  deadline?: string;
  priority: "High" | "Medium" | "Low";
  category: string;
  completed: boolean;
  cognitiveType?: "Deep Work" | "Admin Work" | "Creative Session" | "Rest Break";
}

interface Habit {
  id: string;
  name: string;
  frequency: string;
  targetCount: number;
  createdAt: string;
}

interface EnergyForecastProps {
  tasks: Task[];
  habits: Habit[];
  addHabit?: (habitData: any) => Promise<any>;
}

// 24-hour Circadian baseline energy values (0 = midnight, 23 = 11 PM)
const CIRCADIAN_BASELINE = [
  15, 12, 10, 10, 12, 20, 45, 65, 80, 95, 95, 90, 
  80, 70, 55, 50, 60, 75, 80, 78, 70, 55, 35, 20
];

export default function EnergyForecast({ tasks, habits, addHabit }: EnergyForecastProps) {
  const [showTooltipInfo, setShowTooltipInfo] = useState(false);
  const [addingHabit, setAddingHabit] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get current hour for highlighting
  const currentHour = useMemo(() => new Date().getHours(), []);

  // Compute energy forecast data
  const forecastData = useMemo(() => {
    const data = [];
    const activeTasks = tasks.filter(t => !t.completed && t.deadline);
    
    // Check local storage for today's habit log completions
    const todayStr = new Date().toISOString().split("T")[0];
    let completedHabitsCount = 0;
    try {
      // Look up logged completions for habits
      const mockLogsKey = `lmls_logs_`;
      const allKeys = Object.keys(localStorage);
      const userLogKeys = allKeys.filter(k => k.startsWith(mockLogsKey));
      if (userLogKeys.length > 0) {
        const firstKey = userLogKeys[0];
        const logsStr = localStorage.getItem(firstKey);
        if (logsStr) {
          const logs = JSON.parse(logsStr);
          completedHabitsCount = logs.filter((l: any) => l.date === todayStr && l.done).length;
        }
      }
    } catch (e) {
      console.warn("Could not check habit logs for forecast", e);
    }

    const habitBooster = Math.min(completedHabitsCount * 4, 15); // +4% energy per completed habit, max 15%

    // Step 1: Initialize 24 hours
    for (let hour = 0; hour < 24; hour++) {
      let baseline = CIRCADIAN_BASELINE[hour];
      let cognitiveLoad = 0;
      let tasksImpacted: string[] = [];

      // Add habit boost during awake hours (6 AM to 10 PM)
      if (hour >= 6 && hour <= 22) {
        baseline = Math.min(baseline + habitBooster, 100);
      }

      // Step 2: Overlay active tasks
      activeTasks.forEach((task) => {
        const d = new Date(task.deadline!);
        // Check if deadline is today or tomorrow (within forecast range)
        const isTodayOrTomorrow = d.toDateString() === new Date().toDateString() || 
          d.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
        
        if (isTodayOrTomorrow) {
          const deadlineHour = d.getHours();
          const diffInHours = Math.abs(hour - deadlineHour);

          // We assume a task influences cognitive fatigue/load in the 3 hours preceding its deadline
          if (hour <= deadlineHour && diffInHours <= 3) {
            let loadValue = 0;
            
            if (task.cognitiveType) {
              switch (task.cognitiveType) {
                case "Deep Work":
                  loadValue = task.priority === "High" ? 25 : 18;
                  break;
                case "Creative Session":
                  loadValue = task.priority === "High" ? 18 : 12;
                  break;
                case "Admin Work":
                  loadValue = task.priority === "High" ? 12 : 8;
                  break;
                case "Rest Break":
                  // Rest breaks act as negative load (i.e. wellness boost!)
                  loadValue = -15;
                  break;
                default:
                  loadValue = 10;
              }
            } else {
              // Fallback to priority if no cognitiveType
              loadValue = task.priority === "High" ? 20 : task.priority === "Medium" ? 12 : 6;
            }

            cognitiveLoad += loadValue;
            if (loadValue > 0) {
              tasksImpacted.push(task.title);
            }
          }
        }
      });

      // Calculate final projected energy. Cognitive load decreases mental energy
      const projectedEnergy = Math.max(10, Math.min(100, baseline - cognitiveLoad));

      // Display format: Hour Label (e.g. 9 AM, 12 PM, 3 PM)
      const hourLabel = hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;

      data.push({
        hour,
        hourLabel,
        energy: projectedEnergy,
        baseline: baseline,
        cognitiveLoad: Math.max(0, cognitiveLoad),
        tasks: tasksImpacted.length > 0 ? tasksImpacted.join(", ") : "None"
      });
    }

    return data;
  }, [tasks, habits]);

  // Find optimal high-energy work windows (>70% projected energy)
  const optimalWindows = useMemo(() => {
    const windows: Array<{ start: number; end: number }> = [];
    let currentWindow: { start: number; end: number } | null = null;

    forecastData.forEach((d) => {
      // Exclude sleeping hours from optimal work suggestions (10 PM to 6 AM)
      const isAwakeHour = d.hour >= 7 && d.hour <= 21;
      const isHighEnergy = d.energy >= 65;

      if (isHighEnergy && isAwakeHour) {
        if (!currentWindow) {
          currentWindow = { start: d.hour, end: d.hour };
        } else {
          currentWindow.end = d.hour;
        }
      } else {
        if (currentWindow) {
          if (currentWindow.end - currentWindow.start >= 1) {
            windows.push(currentWindow);
          }
          currentWindow = null;
        }
      }
    });

    if (currentWindow && currentWindow.end - currentWindow.start >= 1) {
      windows.push(currentWindow);
    }

    return windows.map(w => {
      const formatH = (h: number) => {
        return h === 12 ? "12:00 PM" : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
      };
      return {
        label: `${formatH(w.start)} - ${formatH(w.end + 1)}`,
        hours: w.end - w.start + 1
      };
    });
  }, [forecastData]);

  // Detect consecutive high-intensity focus blocks without rest breaks
  const highIntensityAnomaly = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed && t.deadline);
    // Sort tasks by deadline hour today
    const todaysTasks = activeTasks.filter(t => {
      const d = new Date(t.deadline!);
      return d.toDateString() === new Date().toDateString();
    }).sort((a, b) => new Date(a.deadline!).getHours() - new Date(b.deadline!).getHours());

    if (todaysTasks.length < 2) return null;

    let consecutiveHighBlocksCount = 0;
    let lastTaskHour = -999;
    let hasRestBreakInBetween = false;

    for (let i = 0; i < todaysTasks.length; i++) {
      const t = todaysTasks[i];
      const hour = new Date(t.deadline!).getHours();

      if (t.cognitiveType === "Deep Work" || t.priority === "High") {
        if (lastTaskHour !== -999 && (hour - lastTaskHour <= 3)) {
          if (!hasRestBreakInBetween) {
            consecutiveHighBlocksCount++;
          }
        } else {
          consecutiveHighBlocksCount = 1;
        }
        lastTaskHour = hour;
        hasRestBreakInBetween = false; // reset
      } else if (t.cognitiveType === "Rest Break") {
        hasRestBreakInBetween = true;
      }
    }

    return consecutiveHighBlocksCount >= 2;
  }, [tasks]);

  // Quick action to add a Buffer Break habit
  const handleAddBufferHabit = async () => {
    if (!addHabit) return;
    setAddingHabit(true);
    try {
      await addHabit({
        name: "Take 15m Buffer Break",
        frequency: "daily",
        targetCount: 1,
      });
      setSuccessMessage("Buffer Break habit added to your tracker!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingHabit(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm font-sans space-y-6">
      
      {/* Header section with Cognitive metadata */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-slate-950 dark:text-slate-100 tracking-tight font-display">
                Cognitive Energy Forecast
              </h3>
              <button 
                onClick={() => setShowTooltipInfo(!showTooltipInfo)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="About energy curves"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Predictive 24-hour mental focus mapping calculated from active deadlines and habits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/30 text-violet-700 dark:text-violet-400 py-1.5 px-3 rounded-xl font-display">
            <Zap className="w-3.5 h-3.5" />
            Wellness Engine Active
          </span>
        </div>
      </div>

      {/* Interactive Tooltip / Explanation banner */}
      {showTooltipInfo && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">How is your energy forecast calculated?</p>
          Your baseline mental energy curve is modeled using natural circadian sleep-wake states (with peak focus around mid-morning and early evening). 
          Active tasks introduce <span className="font-bold text-violet-500">Cognitive Load</span> in the 3 hours preceding their deadline. 
          <span className="font-semibold text-violet-600 dark:text-violet-400"> Deep Work</span> tasks draw high cognitive energy, 
          <span className="font-semibold text-sky-600 dark:text-sky-400"> Creative Sessions</span> take moderate energy, and 
          <span className="font-semibold text-emerald-600 dark:text-emerald-400"> Rest Breaks</span> or completed habits actively restore focus reserves!
        </div>
      )}

      {/* Split visual block: Chart on left/middle, details & windows on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spline area chart */}
        <div className="lg:col-span-2 space-y-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                <XAxis
                  dataKey="hourLabel"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  interval={3}
                  className="font-mono font-bold"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, 100]}
                  dy={-3}
                  className="font-mono font-bold"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl shadow-xl font-sans text-xs space-y-1.5 max-w-xs">
                          <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-800 pb-1">
                            <span>{data.hourLabel}</span>
                            <span className="text-violet-400 font-mono">{data.energy}% Energy</span>
                          </div>
                          <div className="text-[10px] text-slate-400 space-y-0.5">
                            <p><span className="font-semibold text-slate-300">Circadian Base:</span> {data.baseline}%</p>
                            <p><span className="font-semibold text-slate-300">Cognitive Load:</span> {data.cognitiveLoad}%</p>
                            {data.tasks !== "None" && (
                              <p className="text-violet-300 mt-1 line-clamp-2">
                                <span className="font-bold text-slate-300">Approaching:</span> {data.tasks}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  x={forecastData[currentHour]?.hourLabel} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: "Now", 
                    position: "top", 
                    fill: "#ef4444", 
                    fontSize: 10,
                    className: "font-bold font-mono"
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  name="Projected Energy"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#energyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 px-2 font-bold uppercase tracking-wider">
            <span>Morning Peak</span>
            <span>Afternoon Slump</span>
            <span>Evening Catchup</span>
          </div>
        </div>

        {/* Windows and Warnings panel */}
        <div className="bg-slate-50 dark:bg-slate-950/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-900 flex flex-col justify-between space-y-4">
          
          {/* Work windows container */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider font-display flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-violet-500" />
              Optimal Work Windows
            </h4>

            {optimalWindows.length === 0 ? (
              <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400">
                <p className="text-xs font-bold leading-normal">High Cognitive Load Detected</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Your schedule shows high fatigue periods. Consider inserting a Rest Break.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {optimalWindows.map((win, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 bg-violet-50/40 dark:bg-violet-950/15 border border-violet-100/30 dark:border-violet-900/10 rounded-xl text-xs font-semibold"
                  >
                    <div className="space-y-0.5">
                      <p className="text-violet-800 dark:text-violet-300 font-bold">{win.label}</p>
                      <p className="text-[10px] text-slate-400">Peak mental acuity reserves</p>
                    </div>
                    <span className="px-2 py-1 bg-violet-100/50 dark:bg-violet-950/80 text-violet-700 dark:text-violet-400 text-[10px] font-mono font-bold rounded-lg border border-violet-200/20">
                      {win.hours}h block
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alert / Wellness Warning container */}
          <div className="space-y-2 border-t border-slate-150 dark:border-slate-850 pt-4">
            {highIntensityAnomaly ? (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-900/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-extrabold font-display">
                  <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 animate-bounce" />
                  <span>CONSECUTIVE DEEP BLOCKS</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-normal font-medium text-[11px]">
                  You have high-intensity tasks scheduled consecutively today without pauses. This will cause mental depletion.
                </p>
                {addHabit && (
                  <button
                    onClick={handleAddBufferHabit}
                    disabled={addingHabit}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-md shadow-amber-600/15 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {addingHabit ? "Adding..." : "Add 'Buffer Break' Habit"}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 font-semibold leading-relaxed">
                <BatteryCharging className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                <div>
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 font-display text-[11px]">Healthy Work Flow</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Focus levels and rest blocks are balanced nicely today.</p>
                </div>
              </div>
            )}

            {/* Habit Addition Success Banner */}
            {successMessage && (
              <div className="p-2 text-center text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg animate-fadeIn border border-emerald-200/20">
                {successMessage}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
