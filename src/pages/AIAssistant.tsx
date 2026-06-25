import React from "react";
import ChatInterface from "../components/AI/ChatInterface";
import { MessageSquareCode } from "lucide-react";

interface AIAssistantProps {
  tasks: any[];
  chat: (history: any[], message: string) => Promise<{ reply: string; history: any[] }>;
  breakdownTask: (task: any) => Promise<string[]>;
}

export default function AIAssistant({ tasks, chat, breakdownTask }: AIAssistantProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <MessageSquareCode className="w-7 h-7 text-rose-500" />
          AI Coach Companion
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          A proactive conversational assistant to help you break through procrastination and outline quick plans.
        </p>
      </div>

      <ChatInterface
        tasks={tasks}
        chat={chat}
        breakdownTask={breakdownTask}
      />
    </div>
  );
}
