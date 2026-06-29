import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Link, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Check, 
  ShieldAlert, 
  Search,
  ExternalLink,
  ChevronRight,
  User,
  Coffee,
  Brain,
  Zap,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

interface GoogleCalendarProps {
  tasks: any[];
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface RecommendedSchedule {
  taskId: string;
  taskTitle: string;
  suggestedStart: string;
  suggestedEnd: string;
  explanation: string;
}

export default function GoogleCalendar({ tasks }: GoogleCalendarProps) {
  const { user, getAuthToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Smart scheduler state
  const [scheduling, setScheduling] = useState(false);
  const [schedules, setSchedules] = useState<RecommendedSchedule[]>([]);
  const [scheduledTaskIds, setScheduledTaskIds] = useState<Record<string, boolean>>({});
  const [addingEventId, setAddingEventId] = useState<string | null>(null);

  const fetchStatusAndEvents = async () => {
    setLoading(true);
    try {
      const idToken = await getAuthToken();
      
      // Get connection status
      const statusRes = await axios.get("/api/calendar/status", {
        headers: { Authorization: `Bearer={idToken}` }
      });
      setConnected(statusRes.data.connected);
      setCalendarEmail(statusRes.data.email);

      // List events
      const eventsRes = await axios.get("/api/calendar/events", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setEvents(eventsRes.data);
    } catch (err) {
      console.error("Failed checking Google Calendar status and events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStatusAndEvents();
    }
  }, [user]);

  const handleConnectCalendar = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar");
      provider.addScope("https://www.googleapis.com/auth/calendar.events");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error("Failed to retrieve Google API access token.");
      }

      const idToken = await getAuthToken();
      const res = await axios.post("/api/calendar/connect", { accessToken }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      setConnected(true);
      setCalendarEmail(res.data.email || result.user.email);
      
      // Refresh events
      const eventsRes = await axios.get("/api/calendar/events", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setEvents(eventsRes.data);

      alert("Success! Google Calendar has been connected securely with OAuth.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Authorization failed. (Simulated Calendar is still active for offline testing!)");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect Google Calendar?")) return;
    setLoading(true);
    try {
      const idToken = await getAuthToken();
      await axios.post("/api/calendar/disconnect", {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setConnected(false);
      setCalendarEmail(null);
      setSchedules([]);
      
      // Reload simulated events
      const eventsRes = await axios.get("/api/calendar/events", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSmartSchedule = async () => {
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) {
      alert("No active tasks to schedule! Create a task first on the dashboard.");
      return;
    }

    setScheduling(true);
    setSchedules([]);
    try {
      const idToken = await getAuthToken();
      const res = await axios.post("/api/calendar/smart-schedule", {
        tasks: incompleteTasks,
        events
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setSchedules(res.data.schedules || []);
    } catch (err) {
      console.error(err);
      alert("Gemini failed to suggest an optimized schedule.");
    } finally {
      setScheduling(false);
    }
  };

  const handleAddEvent = async (schedule: RecommendedSchedule) => {
    setAddingEventId(schedule.taskId);
    try {
      const idToken = await getAuthToken();
      const res = await axios.post("/api/calendar/add-event", {
        title: `🎯 Focus Block: ${schedule.taskTitle}`,
        description: `${schedule.explanation}\n\nCreated by The Last-Minute Life Saver app.`,
        startTime: schedule.suggestedStart,
        endTime: schedule.suggestedEnd
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.data.success) {
        setScheduledTaskIds(prev => ({ ...prev, [schedule.taskId]: true }));
        // Refresh local calendar event list
        const eventsRes = await axios.get("/api/calendar/events", {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        setEvents(eventsRes.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add event to Google Calendar.");
    } finally {
      setAddingEventId(null);
    }
  };

  const formatEventTime = (startStr?: string, endStr?: string) => {
    if (!startStr) return "All Day";
    const start = new Date(startStr);
    const startFmt = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (!endStr) return startFmt;
    const end = new Date(endStr);
    const endFmt = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `${startFmt} - ${endFmt}`;
  };

  const formatEventDate = (startStr?: string) => {
    if (!startStr) return "";
    const d = new Date(startStr);
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight sm:text-3xl font-display">
            Google Calendar Sync
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Connect your calendar, view upcoming engagements, and use Gemini AI to block focus slots for tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-semibold shadow-sm">
                📅 {calendarEmail}
              </span>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 border border-rose-100 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectCalendar}
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              {connecting ? "Connecting..." : "Connect Google Calendar"}
            </button>
          )}
        </div>
      </div>

      {/* Sandbox Banner */}
      {!connected && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-3xl p-5 flex items-start gap-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
              Interactive Sandbox Active
            </h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              We have loaded simulated calendar events (meetings, lectures, gym sessions) in your sandbox below so you can experiment with Gemini Smart Scheduling and one-click focus blocking instantly without authentication. Click "Connect Google Calendar" above to log in to your real Google account!
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Events List / Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-blue-500" />
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight font-display">
                  Your Agenda
                </h2>
              </div>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
                {events.length} Events Listed
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                <p className="text-[11px] text-slate-400 font-semibold">Updating agenda...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No events found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Your calendar is completely empty!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => {
                  const isFocusBlock = event.summary.toLowerCase().includes("focus block") || event.summary.includes("🎯");
                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event === selectedEvent ? null : event)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isFocusBlock
                          ? "bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20"
                          : "bg-slate-50/40 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/40 border-slate-100 dark:border-slate-850"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {event.summary}
                          </h4>
                          {event.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-normal">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg font-mono">
                              📅 {formatEventDate(event.start?.dateTime || event.start?.date)}
                            </span>
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg">
                              ⏰ {formatEventTime(event.start?.dateTime || event.start?.date, event.end?.dateTime || event.end?.date)}
                            </span>
                            {event.location && (
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg">
                                📍 {event.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${selectedEvent?.id === event.id ? "rotate-90" : ""}`} />
                      </div>

                      {/* Event Detail Panel */}
                      {selectedEvent?.id === event.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-2">
                          {event.description && (
                            <p><b>Description:</b> {event.description}</p>
                          )}
                          {event.location && (
                            <p><b>Location:</b> {event.location}</p>
                          )}
                          <p><b>Starts:</b> {new Date(event.start?.dateTime || "").toString()}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Proactive Scheduler Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                    Smart AI Scheduler
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Proactively block focus times
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunSmartSchedule}
                disabled={scheduling}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {scheduling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {scheduling ? "Analyzing..." : "Auto-Schedule"}
              </button>
            </div>

            {/* Instruction or scheduling state */}
            {scheduling ? (
              <div className="py-12 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin"></div>
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Calculating Perfect Focus Blocks
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                    Gemini is checking your outstanding tasks and existing meetings, mapping deadline priority, and matching slots in your day to guarantee optimal performance.
                  </p>
                </div>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Optimize Your Work Blocks
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto mt-1">
                  Click the **Auto-Schedule** button above. Gemini AI will automatically find empty gaps in your calendar and allocate dedicated focus blocks for all outstanding tasks.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 rounded-2xl p-4 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                      Gemini Schedule Output
                    </h4>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed">
                      Accept recommended slots to add them directly onto your live Google Calendar agenda.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {schedules.map((schedule, idx) => {
                    const isAdded = scheduledTaskIds[schedule.taskId];
                    const isAdding = addingEventId === schedule.taskId;
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 border rounded-2xl transition-all ${
                          isAdded
                            ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2.5">
                            <div>
                              <h4 className={`text-xs font-bold leading-snug ${isAdded ? "text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>
                                {schedule.taskTitle}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-0.5">
                                {schedule.explanation}
                              </p>
                            </div>

                            <button
                              onClick={() => handleAddEvent(schedule)}
                              disabled={isAdded || isAdding}
                              className={`p-2 rounded-xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${
                                isAdded
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 cursor-default"
                                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/10"
                              }`}
                              title={isAdded ? "Scheduled on Calendar" : "Add to Calendar"}
                            >
                              {isAdding ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : isAdded ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-100/20 font-mono">
                              ⏰ Start: {new Date(schedule.suggestedStart).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg font-mono">
                              Duration: 1.5 hrs
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Tasks list overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase font-display mb-3">
              OUTSTANDING TASKS
            </h3>
            {tasks.filter(t => !t.completed).length === 0 ? (
              <div className="text-center py-4 text-[10px] text-slate-400">
                🎉 No pending tasks! You are fully on top of your schedule.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.filter(t => !t.completed).slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-50 dark:border-slate-850">
                    <div className="truncate space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {task.title}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400">
                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${
                      task.priority === "High" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40" : "bg-blue-50 text-blue-600 dark:bg-blue-950/40"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
                {tasks.filter(t => !t.completed).length > 3 && (
                  <p className="text-[10px] text-slate-400 font-medium text-center pt-1">
                    + {tasks.filter(t => !t.completed).length - 3} more outstanding tasks
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
