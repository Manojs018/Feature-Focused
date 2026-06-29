import React from "react";
import { LayoutDashboard, MessageSquareCode, FlameKindling, BarChart3, LogOut, ShieldAlert, X } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "assistant", label: "AI Coach Chat", icon: MessageSquareCode },
    { id: "goals", label: "Habits & Goals", icon: FlameKindling },
    { id: "insights", label: "AI Insights", icon: BarChart3 },
  ];

  return (
    <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col text-slate-600 dark:text-slate-300 h-screen fixed top-0 left-0 z-40 font-sans transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    }`}>
      {/* Brand logo & close button */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45 animate-pulse"></div>
          </div>
          <div>
            <h1 className="font-display font-bold text-base leading-tight text-slate-800 dark:text-white tracking-tight">
              Last-Minute
            </h1>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold tracking-wider uppercase">
              Life Saver
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {setIsOpen && (
          <button
            id="close-mobile-sidebar-btn"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (setIsOpen) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User profile / Logout bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <img
            src={user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.displayName}`}
            alt="avatar"
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 ring-2 ring-slate-100 dark:ring-slate-800"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.displayName}</h4>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
