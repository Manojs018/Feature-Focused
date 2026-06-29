import React from "react";
import { Sparkles, Calendar, Clock, Sun, Moon, RefreshCw, Mail, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [time, setTime] = React.useState(new Date());
  const { user, getAuthToken } = useAuth();
  const [syncing, setSyncing] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("app_theme");
      if (stored) return stored;
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return systemPrefersDark ? "dark" : "light";
    }
    return "light";
  });

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    async function checkStatus() {
      if (!user) {
        setIsConnected(false);
        return;
      }
      try {
        const idToken = await getAuthToken();
        const res = await axios.get("/api/gmail/status", {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        setIsConnected(res.data.connected);
      } catch (err) {
        console.error("Failed to check Gmail status in Navbar", err);
      }
    }
    checkStatus();
    
    // Listen for connection events from Dashboard
    const handleConnectChange = () => checkStatus();
    window.addEventListener("gmail-connection-changed", handleConnectChange);
    return () => window.removeEventListener("gmail-connection-changed", handleConnectChange);
  }, [user]);

  const handleSyncGmail = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const idToken = await getAuthToken();
      const res = await axios.post("/api/gmail/sync", {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      alert(`Gmail Sync complete! Checked unread emails. Created ${res.data.createdTasksCount || 0} tasks.`);
      // Reload tasks on the dashboard
      window.dispatchEvent(new CustomEvent("gmail-synced"));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to sync Gmail. Please reconnect or check your token.");
    } finally {
      setSyncing(false);
    }
  };

  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("app_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("app_theme", "light");
    }
  }, [theme]);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-20 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            id="open-mobile-sidebar-btn"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100/60 dark:border-blue-900/40 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 fill-blue-600/10 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-bold tracking-tight text-blue-800 dark:text-blue-300">
            AI Productivity Hub Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
        {user && isConnected && (
          <button
            onClick={handleSyncGmail}
            disabled={syncing}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/40 text-indigo-700 dark:text-indigo-400 rounded-xl transition-all cursor-pointer font-bold shadow-sm"
            title="Fetch unread emails and extract tasks via Gemini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Sync Gmail</span>
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 pr-4">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>
            {time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-slate-700 dark:text-slate-300 tracking-wider font-bold">
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        
        <button
          id="theme-toggle-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-500 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
}
