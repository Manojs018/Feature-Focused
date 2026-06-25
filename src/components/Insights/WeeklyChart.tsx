import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart2, Award } from "lucide-react";

interface WeeklyChartProps {
  data: Array<{ date: string; count: number }>;
  onTimeRate: number;
}

export default function WeeklyChart({ data, onTimeRate }: WeeklyChartProps) {
  // Format dates nicely for labels: YYYY-MM-DD -> e.g. "Jun 24"
  const formattedData = data.map((item) => {
    const d = new Date(item.date);
    const label = d.toLocaleDateString([], { month: "short", day: "numeric" });
    return {
      ...item,
      label,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm font-sans">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Weekly Task Completion Velocity
          </h3>
        </div>

        {/* On-time rate badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10 rounded-xl text-xs font-bold font-display">
          <Award className="w-4 h-4 text-emerald-500" />
          <span>On-Time rate: {onTimeRate}%</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              className="font-mono font-bold"
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              className="font-mono font-bold"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "12px",
                border: "none",
                color: "#fff",
                fontSize: "12px",
              }}
              cursor={{ fill: "rgba(99, 102, 241, 0.04)" }}
            />
            <Bar
              dataKey="count"
              name="Tasks Completed"
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
