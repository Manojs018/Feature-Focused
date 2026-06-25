import React, { useState } from "react";
import { ShieldAlert, LogIn, ChevronRight, Sparkles } from "lucide-react";

interface GoogleLoginProps {
  onLoginWithGoogle: () => Promise<void>;
  onLoginWithMock: (name: string, email: string) => void;
}

export default function GoogleLogin({ onLoginWithGoogle, onLoginWithMock }: GoogleLoginProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [useDemo, setUseDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await onLoginWithGoogle();
    } catch (err: any) {
      setError(
        "Google Sign-In was blocked or failed (this is common in standard sandboxed iframes). Please use the Instant Demo Sign-In below!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginWithMock(name || "Last-Minute Hero", email || "hero@example.com");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-rose-950/20 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-gradient-to-tr from-amber-500 to-rose-500 p-4 rounded-2xl text-white shadow-lg shadow-rose-500/20 mb-4">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            The Last-Minute Life Saver
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Stop missing deadlines. Start taking action.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 leading-relaxed">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            Sign in with Google
          </button>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative px-3 bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Or Choose Sandbox Bypass
            </span>
          </div>

          {!useDemo ? (
            <button
              onClick={() => setUseDemo(true)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-slate-300 font-medium rounded-xl transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Instant Demo Sign-In (No Popup)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          ) : (
            <form onSubmit={handleDemoSubmit} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Student"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-rose-500/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-rose-500/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setUseDemo(false)}
                  className="flex-1 px-4 py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/10"
                >
                  Enter Workspace
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
