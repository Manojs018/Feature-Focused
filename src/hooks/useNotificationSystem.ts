import { useState, useEffect, useRef } from "react";

export interface InAppToast {
  id: string;
  title: string;
  message: string;
  type: "approaching" | "passed";
  createdAt: string;
  taskId: string;
}

export function useNotificationSystem(tasks: any[]) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("notifications_enabled");
      return stored !== null ? stored === "true" : true;
    }
    return true;
  });

  const [thresholdMinutes, setThresholdMinutes] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("notification_threshold_minutes");
      return stored !== null ? parseInt(stored, 10) : 15;
    }
    return 15;
  });

  const [inAppToasts, setInAppToasts] = useState<InAppToast[]>([]);
  const sentNotificationsRef = useRef<Record<string, boolean>>({});

  // Load sent notification history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sent_deadline_notifications");
        if (stored) {
          sentNotificationsRef.current = JSON.parse(stored);
        }
      } catch (err) {
        console.error("Failed to parse sent notifications history:", err);
      }
    }
  }, []);

  // Sync state helpers
  const updateNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem("notifications_enabled", String(enabled));
  };

  const updateThresholdMinutes = (minutes: number) => {
    setThresholdMinutes(minutes);
    localStorage.setItem("notification_threshold_minutes", String(minutes));
  };

  // Safe wrapper to save sent notifications to localStorage
  const markNotificationAsSent = (key: string) => {
    sentNotificationsRef.current[key] = true;
    try {
      localStorage.setItem(
        "sent_deadline_notifications",
        JSON.stringify(sentNotificationsRef.current)
      );
    } catch (err) {
      console.error("Failed to save sent notifications state:", err);
    }
  };

  // Add an in-app toast
  const triggerInAppToast = (
    taskId: string,
    title: string,
    message: string,
    type: "approaching" | "passed"
  ) => {
    const newToast: InAppToast = {
      id: `${taskId}_${type}_${Date.now()}`,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      taskId,
    };
    setInAppToasts((prev) => [newToast, ...prev]);
  };

  // Dismiss an in-app toast
  const dismissToast = (id: string) => {
    setInAppToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Clear all in-app toasts
  const clearAllToasts = () => {
    setInAppToasts([]);
  };

  // Request browser notification permission
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "default";
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch (err) {
      console.error("Error requesting browser notification permission:", err);
      return "default";
    }
  };

  // Core handler to trigger a notification
  const notifyUser = (
    taskId: string,
    title: string,
    body: string,
    type: "approaching" | "passed"
  ) => {
    // 1. Trigger the in-app fallback toast (guarantees notice inside sandbox iframes)
    triggerInAppToast(taskId, title, body, type);

    // 2. Trigger native Web Notification if enabled and permitted
    if (
      notificationsEnabled &&
      permission === "granted" &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          tag: `${taskId}-${type}`,
          requireInteraction: type === "passed", // Require dismissal for overdue critical alerts
        });
      } catch (err) {
        console.warn("Failed to fire native Web Notification (likely iframe restrictions):", err);
      }
    }
  };

  // Polling loop to evaluate task deadlines
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const checkDeadlines = () => {
      const now = Date.now();
      const thresholdMs = thresholdMinutes * 60 * 1000;

      tasks.forEach((task) => {
        // Only inspect incomplete tasks with a valid deadline
        if (task.completed || !task.deadline) return;

        const deadlineTime = new Date(task.deadline).getTime();
        const diffMs = deadlineTime - now;

        const approachingKey = `${task.id}_approaching_${thresholdMinutes}`;
        const passedKey = `${task.id}_passed`;

        // Case 1: Deadline Has Passed (Overdue)
        if (diffMs <= 0) {
          if (!sentNotificationsRef.current[passedKey]) {
            notifyUser(
              task.id,
              "🚨 Task Deadline Overdue!",
              `"${task.title}" was due at ${new Date(task.deadline).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}.`,
              "passed"
            );
            markNotificationAsSent(approachingKey); // Also mark approaching as done to prevent back-notifications
            markNotificationAsSent(passedKey);
          }
        }
        // Case 2: Deadline Approaching (Within the user-defined threshold window)
        else if (diffMs <= thresholdMs) {
          if (!sentNotificationsRef.current[approachingKey]) {
            const minutesLeft = Math.ceil(diffMs / (60 * 1000));
            notifyUser(
              task.id,
              "⏰ Deadline Approaching!",
              `"${task.title}" is due in ${minutesLeft} minute${
                minutesLeft === 1 ? "" : "s"
              } (${new Date(task.deadline).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}).`,
              "approaching"
            );
            markNotificationAsSent(approachingKey);
          }
        }
      });
    };

    // Run immediately on tasks load/change
    checkDeadlines();

    // Poll every 15 seconds to ensure highly responsive real-time deadline scanning
    const interval = setInterval(checkDeadlines, 15000);
    return () => clearInterval(interval);
  }, [tasks, thresholdMinutes, permission, notificationsEnabled]);

  // Direct manual test button utility
  const testNotificationSystem = () => {
    notifyUser(
      "test-task-id",
      "🔔 Notification Test Succeeded!",
      "Your Last-Minute Life Saver alert system is active and ready to keep you on schedule.",
      "approaching"
    );
  };

  return {
    permission,
    notificationsEnabled,
    thresholdMinutes,
    inAppToasts,
    requestPermission,
    updateNotificationsEnabled,
    updateThresholdMinutes,
    dismissToast,
    clearAllToasts,
    testNotificationSystem,
  };
}
