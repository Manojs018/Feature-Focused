import React, { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useTasks } from "./hooks/useTasks";
import { useHabits } from "./hooks/useHabits";
import { useAI } from "./hooks/useAI";

// Layout components
import Sidebar from "./components/Layout/Sidebar";
import Navbar from "./components/Layout/Navbar";

// Auth page
import GoogleLogin from "./components/Auth/GoogleLogin";

// Pages
import Dashboard from "./pages/Dashboard";
import AIAssistant from "./pages/AIAssistant";
import Goals from "./pages/Goals";
import Insights from "./pages/Insights";

import { ShieldAlert, Loader2 } from "lucide-react";

export default function App() {
  const { user, loading, loginWithGoogle, loginWithMock, logout, getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mount backend services hooks when user is logged in
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    loading: tasksLoading,
  } = useTasks(getAuthToken, user);

  const {
    habits,
    streaks,
    loading: habitsLoading,
    addHabit,
    logHabit,
  } = useHabits(getAuthToken, user);

  const {
    getBriefing,
    prioritizeTasks,
    chat,
    breakdownTask,
    getWeeklyInsights,
  } = useAI(getAuthToken);

  // If Auth state is still loading, show spinning logo
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="bg-gradient-to-tr from-amber-500 to-rose-500 p-4 rounded-3xl text-white shadow-xl shadow-rose-500/10 mb-4 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          The Last-Minute Life Saver
        </h2>
        <p className="text-xs text-rose-400 font-semibold tracking-widest uppercase mt-1">
          Loading Productivity Hub...
        </p>
        <Loader2 className="w-5 h-5 animate-spin text-rose-500 mt-6" />
      </div>
    );
  }

  // If user is not logged in, show Auth Gate
  if (!user) {
    return (
      <GoogleLogin
        onLoginWithGoogle={loginWithGoogle}
        onLoginWithMock={loginWithMock}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-800 dark:text-slate-100 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={logout}
      />

      {/* Main Panel Content (shifted right by sidebar width) */}
      <div className="flex-1 flex flex-col pl-64 min-h-screen">
        <Navbar />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto pb-16">
          {activeTab === "dashboard" && (
            <Dashboard
              tasks={tasks}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              completeTask={completeTask}
              getBriefing={getBriefing}
              prioritizeTasks={prioritizeTasks}
              breakdownTask={breakdownTask}
              habits={habits}
              addHabit={addHabit}
            />
          )}

          {activeTab === "assistant" && (
            <AIAssistant
              tasks={tasks}
              chat={chat}
              breakdownTask={breakdownTask}
            />
          )}

          {activeTab === "goals" && (
            <Goals
              habits={habits}
              streaks={streaks}
              loading={habitsLoading}
              addHabit={addHabit}
              logHabit={logHabit}
            />
          )}

          {activeTab === "insights" && (
            <Insights
              getAuthToken={getAuthToken}
              user={user}
              getWeeklyInsights={getWeeklyInsights}
            />
          )}
        </main>
      </div>
    </div>
  );
}
