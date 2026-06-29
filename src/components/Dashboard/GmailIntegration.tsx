import React, { useState, useEffect } from "react";
import { Mail, CheckCircle, AlertTriangle, RefreshCw, X, Play, Shield, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../firebase";

interface GmailIntegrationProps {
  onSyncComplete?: () => void;
}

export default function GmailIntegration({ onSyncComplete }: GmailIntegrationProps) {
  const { user, getAuthToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  
  const [connected, setConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);

  // Simulation inputs
  const [showSimModal, setShowSimModal] = useState(false);
  const [simSubject, setSimSubject] = useState("URGENT: Draft Marketing Proposal for Review");
  const [simBody, setSimBody] = useState("Hi Manoj, please finish the draft proposal for our project by June 30th. Let me know if you need help. Best, Sarah.");
  const [simFrom, setSimFrom] = useState("sarah.manager@company.com");

  const checkStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const idToken = await getAuthToken();
      const res = await axios.get("/api/gmail/status", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setConnected(res.data.connected);
      setGmailEmail(res.data.email);
    } catch (err) {
      console.error("Failed to check Gmail connection status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  const handleConnectGmail = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      // Configure and request Gmail Readonly Scope
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error("Failed to retrieve Google API access token.");
      }

      const idToken = await getAuthToken();
      const res = await axios.post("/api/gmail/connect", { accessToken }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      setConnected(true);
      setGmailEmail(res.data.email || result.user.email);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent("gmail-connection-changed"));
      if (onSyncComplete) onSyncComplete();
      
      alert("Success! Gmail Auto-Pilot has been securely configured with OAuth.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to authorize. (If in iframe sandbox, try manual email simulation instead!)");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect Gmail? This will stop background task extraction.")) return;
    setLoading(true);
    try {
      const idToken = await getAuthToken();
      await axios.post("/api/gmail/disconnect", {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setConnected(false);
      setGmailEmail(null);
      
      window.dispatchEvent(new CustomEvent("gmail-connection-changed"));
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const idToken = await getAuthToken();
      const res = await axios.post("/api/gmail/sync", {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      alert(`Sync Complete!\nEmails scanned: ${res.data.emailsCheckedCount || 0}\nActionable tasks created: ${res.data.createdTasksCount || 0}`);
      
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      alert(err.response?.data?.error || "Sync failed. Reconnecting Gmail usually resolves this.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSimulateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (simulating) return;
    setSimulating(true);
    try {
      const idToken = await getAuthToken();
      const res = await axios.post("/api/gmail/simulate", {
        subject: simSubject,
        body: simBody,
        from: simFrom
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.data.extractedTask) {
        alert(`Success! Simulated unread email received and processed.\n\nDetected Task: "${res.data.extractedTask.title}"\nDeadline: ${new Date(res.data.extractedTask.deadline).toLocaleString()}\nPriority: ${res.data.extractedTask.priority}\n\nInstantly sent FCM simulation push notification!`);
      } else {
        alert("Simulated email processed, but Gemini analyzed it and determined it was not actionable (no task created).");
      }

      setShowSimModal(false);
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      alert("Simulation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse flex items-center justify-center min-h-[140px]">
        <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/10 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm font-sans relative overflow-hidden">
      
      {/* Absolute floating decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full filter blur-2xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              Gmail Auto Task Creation (Auto-Pilot)
            </h3>
            {connected ? (
              <span className="px-2.5 py-1 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200/20 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 font-display">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[9px] font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-850 dark:text-slate-400 rounded-full uppercase tracking-wider font-display">
                Inactive
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Scans unread emails every 30 minutes. Gemini AI analyzes context, extracts actionable tasks, and inserts them directly into your list with instant push notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {connected ? (
            <>
              <div className="text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                {gmailEmail}
              </div>
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="px-4 py-2 text-xs font-bold border border-indigo-100 dark:border-indigo-950 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                Sync Now
              </button>
              <button
                onClick={handleDisconnect}
                className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 rounded-xl transition-all cursor-pointer"
                title="Disconnect Gmail"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleConnectGmail}
                disabled={connecting}
                className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Mail className="w-4 h-4" />
                {connecting ? "Connecting..." : "Connect Gmail"}
              </button>
            </>
          )}

          <button
            onClick={() => setShowSimModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
            title="Simulate unread email task creation"
          >
            <Play className="w-3.5 h-3.5" />
            Simulate Email
          </button>
        </div>
      </div>

      {/* Manual Actionable Email Simulation Modal */}
      {showSimModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  Gmail Simulation Sandbox
                </h4>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/30 rounded-2xl flex items-start gap-2.5">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-medium">
                No Google credentials required! This simulates receiving a fresh unread email, sending it to Gemini, extracting metadata, and triggering instant push notifications.
              </p>
            </div>

            <form onSubmit={handleSimulateEmail} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Sender Email Address
                </label>
                <input
                  type="text"
                  required
                  value={simFrom}
                  onChange={(e) => setSimFrom(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  required
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Email Body
                </label>
                <textarea
                  required
                  rows={4}
                  value={simBody}
                  onChange={(e) => setSimBody(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="flex items-center gap-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {simulating ? "Analyzing with Gemini..." : "Extract with Gemini"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
