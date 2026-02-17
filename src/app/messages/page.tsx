"use client";

import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 h-full bg-white">
      <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <MessageSquare size={48} className="opacity-20" />
      </div>
      <h3 className="font-bold text-slate-400">Your Spiritual Sanctuary</h3>
      <p className="text-xs">Select a chat to start connecting with believers</p>
    </div>
  );
}
