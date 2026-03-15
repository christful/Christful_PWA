"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, MessageSquare, Users as UsersIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export function ChatList({ chats, isLoading, searchQuery, setSearchQuery, onOpenCreateModal }: any) {
  const router = useRouter();
  const params = useParams();
  const selectedId = params.id as string;

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCreateModal}
            className="bg-slate-100 rounded-full hover:bg-[#800517] hover:text-white transition-all"
          >
            <Plus size={20} />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Messenger"
            className="pl-10 rounded-full bg-slate-100 border-none h-11 focus-visible:ring-[#800517]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800517]"></div>
          </div>
        ) : chats.length > 0 ? (
          chats.map((chat: any) => (
            <div
              key={chat.id}
              onClick={() => router.push(`/messages/${chat.id}`)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${selectedId === chat.id ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
            >
              <div className="relative">
                <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white shadow-sm">
                  <AvatarImage src={chat.avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-slate-200 text-[#800517] font-bold text-xl">
                    {chat.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {chat.communityId ? (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#800517] border-2 border-white rounded-lg flex items-center justify-center shadow-sm">
                    <UsersIcon size={12} className="text-white" />
                  </div>
                ) : (
                  <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-slate-800 truncate">{chat.name}</h3>
                  <span className="text-[10px] font-medium text-slate-400">{chat.lastMessageTime || "12:45 PM"}</span>
                </div>
                {chat.communityName && (
                  <p className="text-[10px] font-bold text-[#800517] uppercase tracking-tight truncate mb-0.5">
                    {chat.communityName}
                  </p>
                )}
                <p className="text-slate-500 text-xs truncate leading-relaxed">
                  {chat.lastMessage || "Type to start sharing the word..."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 text-sm italic">No chats found</p>
          </div>
        )}
      </div>
    </div>
  );
}
