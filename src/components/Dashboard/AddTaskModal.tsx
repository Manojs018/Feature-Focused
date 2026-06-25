import React, { useState } from "react";
import { X, Calendar, PlusCircle, Sparkles } from "lucide-react";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (taskData: {
    title: string;
    description?: string;
    deadline: string;
    priority: "High" | "Medium" | "Low";
    category: "Work" | "Study" | "Personal" | "Finance";
    cognitiveType?: "Deep Work" | "Admin Work" | "Creative Session" | "Rest Break";
  }) => Promise<any>;
}

export default function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [category, setCategory] = useState<"Work" | "Study" | "Personal" | "Finance">("Study");
  const [cognitiveType, setCognitiveType] = useState<"Deep Work" | "Admin Work" | "Creative Session" | "Rest Break">("Deep Work");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) {
      setError("Please fill in all required fields (Title & Deadline)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Deadline needs to be ISO string
      const isoDeadline = new Date(deadline).toISOString();
      await onAdd({
        title,
        description,
        deadline: isoDeadline,
        priority,
        category,
        cognitiveType,
      });
      // Reset & close
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("Medium");
      setCategory("Study");
      setCognitiveType("Deep Work");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              Create Life Saver Task
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-display">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Finish chemistry project draft"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-display">
              Task Description
            </label>
            <textarea
              placeholder="Provide a quick outline of requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-medium">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-display">
                Category *
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all font-semibold"
              >
                <option value="Study">Study</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-display">
                Priority *
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all font-semibold"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-display">
              Cognitive Type (Mental Focus Style) *
            </label>
            <select
              value={cognitiveType}
              onChange={(e: any) => setCognitiveType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all font-semibold"
            >
              <option value="Deep Work">Deep Work (High-focus strategy)</option>
              <option value="Admin Work">Admin Work (Low-energy logistics)</option>
              <option value="Creative Session">Creative Session (Inspirational work)</option>
              <option value="Rest Break">Rest Break (Recharge & Buffer)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1 font-display">
              <Calendar className="w-4 h-4 text-slate-400" />
              Deadline Date & Time *
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 dark:text-slate-200 transition-all font-semibold"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 py-1.5 px-3 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AI Prioritization Active
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-500/15"
              >
                {loading ? "Adding..." : "Add Task"}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
