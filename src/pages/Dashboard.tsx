import React, { useState, useEffect } from "react";
import { Plus, ListFilter, Sparkles, CheckCircle2, ShieldAlert, Search, ChevronDown } from "lucide-react";
import TodaysBriefing from "../components/AI/TodaysBriefing";
import FocusModeBanner from "../components/Dashboard/FocusModeBanner";
import TaskCard from "../components/Dashboard/TaskCard";
import AddTaskModal from "../components/Dashboard/AddTaskModal";
import EmptyState from "../components/Dashboard/EmptyState";
import EnergyForecast from "../components/Dashboard/EnergyForecast";
import { sortByUrgency, mergePriorityScores } from "../utils/taskHelpers";

interface DashboardProps {
  tasks: any[];
  addTask: (taskData: any) => Promise<any>;
  updateTask: (taskId: string, updates: any) => Promise<any>;
  deleteTask: (taskId: string) => Promise<any>;
  completeTask: (taskId: string) => Promise<any>;
  getBriefing: (tasks: any[]) => Promise<string>;
  prioritizeTasks: (tasks: any[]) => Promise<any[]>;
  breakdownTask: (task: any) => Promise<string[]>;
  habits?: any[];
  addHabit?: (habitData: any) => Promise<any>;
}

export default function Dashboard({
  tasks,
  addTask,
  updateTask,
  deleteTask,
  completeTask,
  getBriefing,
  prioritizeTasks,
  breakdownTask,
  habits = [],
  addHabit,
}: DashboardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiScores, setAiScores] = useState<any[]>([]);
  const [prioritizing, setPrioritizing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort tasks
  const activeTasks = tasks.filter((t) => !t.completed);
  const sortedTasks = sortByUrgency(tasks);

  // Filter tasks based on category and search query
  const filteredTasks = sortedTasks.filter((task) => {
    const matchesCategory = filterCategory === "All" || task.category === filterCategory;
    const matchesSearch = searchQuery.trim() === "" ||
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.priority?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Most urgent active task for the FocusModeBanner
  const urgentTask = activeTasks.length > 0 ? sortByUrgency(activeTasks)[0] : null;

  // Run AI prioritization when active tasks change
  const triggerPrioritization = async () => {
    if (activeTasks.length === 0) return;
    setPrioritizing(true);
    try {
      const scores = await prioritizeTasks(activeTasks);
      setAiScores(scores);
    } catch (err) {
      console.error(err);
    } finally {
      setPrioritizing(false);
    }
  };

  useEffect(() => {
    if (activeTasks.length > 0 && aiScores.length === 0) {
      triggerPrioritization();
    }
  }, [activeTasks.length]);

  // Merge scores into our local tasks display list
  const displayTasks = mergePriorityScores(filteredTasks, aiScores);

  const categories = ["All", "Study", "Work", "Personal", "Finance"];

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Welcome header block */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight sm:text-3xl font-display">
            Workspace Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Proactive planning controls to stay ahead of approaching deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerPrioritization}
            disabled={prioritizing || activeTasks.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${prioritizing ? "animate-spin" : ""}`} />
            AI Prioritize List
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/15 transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            Create Task
          </button>
        </div>
      </div>

      {/* Todays Briefing Banner */}
      <TodaysBriefing tasks={tasks} getBriefing={getBriefing} />

      {/* Cognitive Fatigue & Energy Forecasting */}
      <EnergyForecast tasks={tasks} habits={habits} addHabit={addHabit} />

      {/* Focus Mode Banner & Task List (Only show if there are tasks) */}
      {tasks.length === 0 ? (
        <EmptyState onCreateTask={() => setShowAddModal(true)} />
      ) : (
        <>
          {/* Focus Mode Banner */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-display">
                Active Priority Focus Area
              </h3>
            </div>
            <FocusModeBanner
              urgentTask={urgentTask}
              breakdownTask={breakdownTask}
              onCompleteTask={completeTask}
            />
          </div>

          {/* Task List Section */}
          <div className="space-y-5">
            
            {/* Filter controls row */}
            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">
                Your Action Items ({displayTasks.length})
              </h3>

              <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    id="dashboard-search-input"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 dark:text-slate-200 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                {/* Dropdown Category Filter */}
                <div className="relative min-w-[140px]">
                  <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <select
                    id="dashboard-category-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 dark:focus:border-blue-500/50 transition-all cursor-pointer shadow-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "All" ? "All Categories" : cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Grid listing */}
            {displayTasks.length === 0 ? (
              <div className="bg-slate-100 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <p className="text-sm font-semibold">No tasks match this filter or search query.</p>
                <p className="text-xs text-slate-500 mt-1">Try resetting your filter parameters or create a new task!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={completeTask}
                    onDelete={deleteTask}
                    breakdownTask={breakdownTask}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Task modal popover */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTask}
      />
    </div>
  );
}
