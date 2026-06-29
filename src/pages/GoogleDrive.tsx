import React, { useState, useEffect } from "react";
import { 
  FolderOpen, 
  FileText, 
  FileSpreadsheet, 
  FileCheck, 
  Sparkles, 
  RefreshCw, 
  Link, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  Download, 
  Clock, 
  Plus, 
  Check, 
  ShieldAlert, 
  Search,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

interface GoogleDriveProps {
  addTask: (taskData: any) => Promise<any>;
}

export default function GoogleDrive({ addTask }: GoogleDriveProps) {
  const { user, getAuthToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState<string | null>(null);
  
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    summary: string;
    tasks: any[];
    textContentSnippet?: string;
  } | null>(null);
  
  const [importing, setImporting] = useState(false);
  const [importedTaskIds, setImportedTaskIds] = useState<Record<number, boolean>>({});

  const checkStatusAndList = async () => {
    setLoading(true);
    try {
      const idToken = await getAuthToken();
      
      // Get connection status
      const statusRes = await axios.get("/api/drive/status", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setConnected(statusRes.data.connected);
      setDriveEmail(statusRes.data.email);

      // List files
      const filesRes = await axios.get("/api/drive/files", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setFiles(filesRes.data);
    } catch (err) {
      console.error("Failed checking Google Drive status and listing files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkStatusAndList();
    }
  }, [user]);

  const handleConnectDrive = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const provider = new GoogleAuthProvider();
      // Add general drive scope for file access requested in checklist
      provider.addScope("https://www.googleapis.com/auth/drive.readonly");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error("Failed to retrieve Google API access token.");
      }

      const idToken = await getAuthToken();
      const res = await axios.post("/api/drive/connect", { accessToken }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      setConnected(true);
      setDriveEmail(res.data.email || result.user.email);
      
      // Refresh files list
      const filesRes = await axios.get("/api/drive/files", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setFiles(filesRes.data);

      alert("Success! Google Drive has been connected securely with OAuth.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Authorization failed. (If in an iframe, simulated Drive files are still available for offline testing!)");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect Google Drive?")) return;
    setLoading(true);
    try {
      const idToken = await getAuthToken();
      await axios.post("/api/drive/disconnect", {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setConnected(false);
      setDriveEmail(null);
      setSelectedFile(null);
      setAnalysisResult(null);
      
      // Reload simulated files
      const filesRes = await axios.get("/api/drive/files", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setFiles(filesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFileForSummary = async (file: any) => {
    setSelectedFile(file);
    setAnalysisResult(null);
    setAnalyzing(true);
    setImportedTaskIds({});

    try {
      const idToken = await getAuthToken();
      const res = await axios.post("/api/drive/summarize", {
        fileId: file.id,
        fileName: file.name,
        fileMimeType: file.mimeType
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setAnalysisResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze file content with Gemini AI.");
      setSelectedFile(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImportSingleTask = async (task: any, index: number) => {
    if (importedTaskIds[index]) return;
    try {
      await addTask({
        title: task.title,
        description: task.description || `Extracted from Google Drive file '${selectedFile?.name}'`,
        deadline: task.deadline,
        priority: task.priority || "Medium",
        category: task.category || "Work",
        cognitiveType: "Admin Work"
      });
      setImportedTaskIds(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error(err);
      alert("Failed to import task.");
    }
  };

  const handleImportAllTasks = async () => {
    if (!analysisResult || analysisResult.tasks.length === 0 || importing) return;
    setImporting(true);
    let successCount = 0;
    
    try {
      for (let i = 0; i < analysisResult.tasks.length; i++) {
        const task = analysisResult.tasks[i];
        if (importedTaskIds[i]) continue;
        
        try {
          await addTask({
            title: task.title,
            description: task.description || `Extracted from Google Drive document '${selectedFile?.name}'`,
            deadline: task.deadline,
            priority: task.priority || "Medium",
            category: task.category || "Work",
            cognitiveType: "Deep Work"
          });
          setImportedTaskIds(prev => ({ ...prev, [i]: true }));
          successCount++;
        } catch (err) {
          console.error(err);
        }
      }
      alert(`Successfully imported ${successCount} tasks into your active Hub task list!`);
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    const type = mimeType || "";
    if (type.includes("pdf")) return <FileText className="w-6 h-6 text-rose-500" />;
    if (type.includes("spreadsheet") || type.includes("sheet")) return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
    if (type.includes("document") || type.includes("word")) return <FileText className="w-6 h-6 text-blue-500" />;
    return <FileText className="w-6 h-6 text-indigo-500" />;
  };

  const getFriendlySize = (sizeStr: string) => {
    if (!sizeStr) return "N/A";
    const bytes = parseInt(sizeStr);
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const filteredFiles = files.filter(f => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight sm:text-3xl font-display">
            Google Drive Co-Pilot
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Connect Google Drive, browse documentation, and use Gemini to summarize files and extract deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-semibold shadow-sm">
                📁 {driveEmail}
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
              onClick={handleConnectDrive}
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              {connecting ? "Connecting..." : "Connect Google Drive"}
            </button>
          )}
        </div>
      </div>

      {/* Connection Indicator Alert Banner */}
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
              We have loaded simulated academic and work documents in your Drive sandbox below so you can experiment with Gemini summarization, task extraction, and one-click deadline importing instantly without authentication. Click "Connect Google Drive" above to log in to your real Google account!
            </p>
          </div>
        </div>
      )}

      {/* Main Grid Layout (Document list + Detail view) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Document list (8 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search bar card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex items-center gap-3">
            <Search className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search documents in Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none w-full font-medium"
            />
          </div>

          {/* Files container */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Loading documents...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
              <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">No files found</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Try adjusting your search filters or check your connection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFiles.map((file) => {
                const isCurrent = selectedFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-48 relative overflow-hidden group ${
                      isCurrent 
                        ? "border-blue-500 dark:border-blue-600 ring-2 ring-blue-500/10" 
                        : "border-slate-200 dark:border-slate-800/80"
                    }`}
                  >
                    <div>
                      {/* Icon & File metadata */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl group-hover:scale-105 transition-transform">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">
                          {getFriendlySize(file.size)}
                        </span>
                      </div>

                      {/* File Name */}
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {file.name}
                      </h3>
                      
                      {/* Modified date */}
                      <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                        <span>
                          {new Date(file.modifiedTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between gap-2">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850"
                        title="Open in Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      
                      <button
                        onClick={() => handleSelectFileForSummary(file)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Analyze File
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gemini Analysis detail sidebar (5 cols on lg) */}
        <div className="lg:col-span-5">
          {selectedFile ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 animate-slideUp">
              
              {/* Header and Close button */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display line-clamp-1">
                      Gemini Co-Pilot
                    </h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      AI Analysis Report
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Analyzing / Loading State */}
              {analyzing ? (
                <div className="py-16 text-center space-y-4 flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin"></div>
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Reading Document
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                      Gemini is scanning the file, constructing a comprehensive outline, and looking for upcoming commitments.
                    </p>
                  </div>
                </div>
              ) : (
                analysisResult && (
                  <div className="space-y-5 animate-fadeIn">
                    
                    {/* Document details header */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 font-mono tracking-wider">
                        ACTIVE FILE
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                        {selectedFile.name}
                      </h4>
                    </div>

                    {/* Summary Block */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase font-display">
                        DOCUMENT SUMMARY
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
                        {analysisResult.summary}
                      </p>
                    </div>

                    {/* Extracted Tasks list */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase font-display">
                          EXTRACTED DEADLINES ({analysisResult.tasks.length})
                        </h3>
                        {analysisResult.tasks.length > 0 && (
                          <button
                            onClick={handleImportAllTasks}
                            disabled={importing}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Import All
                          </button>
                        )}
                      </div>

                      {analysisResult.tasks.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
                          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                            No deadlines detected
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Gemini didn't find specific outstanding milestones or tasks.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {analysisResult.tasks.map((task, idx) => {
                            const isImported = importedTaskIds[idx];
                            return (
                              <div
                                key={idx}
                                className={`p-4 border rounded-2xl transition-all ${
                                  isImported
                                    ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850"
                                    : "bg-gradient-to-br from-indigo-50/10 to-transparent border-indigo-100/50 dark:border-indigo-900/30"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="space-y-1">
                                    <h4 className={`text-xs font-bold leading-snug ${
                                      isImported ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-200"
                                    }`}>
                                      {task.title}
                                    </h4>
                                    {task.description && (
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                                      <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-100/30 font-mono">
                                        📅 {new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                      <span className="text-[9px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg">
                                        {task.priority} Priority
                                      </span>
                                      <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-lg">
                                        {task.category}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleImportSingleTask(task, idx)}
                                    disabled={isImported}
                                    className={`p-2 rounded-xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${
                                      isImported
                                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 cursor-default"
                                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/10"
                                    }`}
                                    title={isImported ? "Imported" : "Import Task"}
                                  >
                                    {isImported ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-slate-300 dark:text-slate-700 animate-pulse" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase mb-1.5 font-display">
                SELECT A FILE TO START
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                Click "Analyze File" on any document. Gemini AI will scan the file contents, draft a smart summary, and extract deadlines for direct task scheduling.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
