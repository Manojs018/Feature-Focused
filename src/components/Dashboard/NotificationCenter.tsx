import React from "react";
import { Bell, BellRing, BellOff, X, AlertTriangle, CheckCircle2, Play, Sparkles } from "lucide-react";
import { InAppToast } from "../../hooks/useNotificationSystem";

// ----------------------------------------------------
// 1. In-App Floating Toast Alerts Stack
// ----------------------------------------------------
interface ToastContainerProps {
  toasts: InAppToast[];
  onDismiss: (id: string) => void;
}

export function NotificationToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      id="notification-toasts-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isPassed = toast.type === "passed";
        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 transform translate-y-0 scale-100 animate-slideIn ${
              isPassed
                ? "bg-rose-50 border-rose-200 dark:bg-slate-900 dark:border-rose-900/40 text-rose-900 dark:text-rose-100 shadow-rose-500/10"
                : "bg-amber-50 border-amber-200 dark:bg-slate-900 dark:border-amber-900/40 text-amber-900 dark:text-amber-100 shadow-amber-500/10"
            }`}
          >
            {/* Status Icon */}
            <div className="mt-0.5">
              {isPassed ? (
                <div className="bg-rose-100 dark:bg-rose-950/50 p-1.5 rounded-lg text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              ) : (
                <div className="bg-amber-100 dark:bg-amber-950/50 p-1.5 rounded-lg text-amber-600 dark:text-amber-400">
                  <BellRing className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content text */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold font-display tracking-tight uppercase mb-1">
                {toast.title}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                {toast.message}
              </p>
              <span className="inline-block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mt-2 font-mono">
                {new Date(toast.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            {/* Close Button */}
            <button
              id={`dismiss-toast-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/40 cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------
// 2. Control Panel & Settings Widget
// ----------------------------------------------------
interface SettingsCardProps {
  permission: NotificationPermission;
  notificationsEnabled: boolean;
  thresholdMinutes: number;
  onRequestPermission: () => Promise<NotificationPermission>;
  onToggleNotifications: (enabled: boolean) => void;
  onChangeThreshold: (minutes: number) => void;
  onTestNotification: () => void;
}

export function NotificationSettingsCard({
  permission,
  notificationsEnabled,
  thresholdMinutes,
  onRequestPermission,
  onToggleNotifications,
  onChangeThreshold,
  onTestNotification,
}: SettingsCardProps) {
  const [requesting, setRequesting] = React.useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    await onRequestPermission();
    setRequesting(false);
  };

  return (
    <div
      id="notification-settings-card"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm font-sans relative overflow-hidden"
    >
      {/* Visual Ambient Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/30">
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5 text-slate-400" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
              Browser Notification Controls
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Get timely screen alerts as your task deadlines approach or pass.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Permission Status Block */}
        <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display">
              Browser Connection Status
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {permission === "granted" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Desktop Alerts Authorized
                  </span>
                </>
              ) : permission === "denied" ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Notifications Blocked by Browser
                  </span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Permission Not Granted Yet
                  </span>
                </>
              )}
            </div>
          </div>

          {permission === "default" && (
            <button
              id="request-notification-permission-btn"
              onClick={handleRequest}
              disabled={requesting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
            >
              {requesting ? "Requesting..." : "Enable Desktop Alerts"}
            </button>
          )}

          {permission === "denied" && (
            <span className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-900/30 max-w-[200px] text-right">
              Using high-fidelity in-app toast overlays because sandbox permissions are blocked.
            </span>
          )}

          {permission === "granted" && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-xl uppercase tracking-wider font-display">
              Active
            </span>
          )}
        </div>

        {/* Configurations Toggle & Threshold Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/40">
            <div>
              <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display">
                Alert Engine Toggle
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {notificationsEnabled ? "Notification Engine Enabled" : "Alert Engine Silenced"}
              </span>
            </div>
            <button
              id="toggle-notifications-btn"
              onClick={() => onToggleNotifications(!notificationsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-none ${
                notificationsEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
              }`}
              aria-label="Toggle alert engine"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${
                  notificationsEnabled ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              ></div>
            </button>
          </div>

          {/* Threshold Selection */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex flex-col justify-center">
            <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 font-display">
              Alert Warning Window
            </span>
            <div className="relative">
              <select
                id="notification-threshold-select"
                value={thresholdMinutes}
                onChange={(e) => onChangeThreshold(parseInt(e.target.value, 10))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
              >
                <option value={5}>5 Minutes Before</option>
                <option value={10}>10 Minutes Before</option>
                <option value={15}>15 Minutes Before</option>
                <option value={30}>30 Minutes Before</option>
                <option value={60}>1 Hour Before</option>
                <option value={120}>2 Hours Before</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Diagnostics Test Trigger */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            💡 <span className="font-semibold text-slate-600 dark:text-slate-300">Note:</span> Testing triggers a demo banner and simulates a screen alert to verify connection.
          </p>

          <button
            id="test-notification-system-btn"
            onClick={onTestNotification}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            Send Test Alert
          </button>
        </div>
      </div>
    </div>
  );
}
