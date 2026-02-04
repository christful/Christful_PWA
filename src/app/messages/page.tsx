"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ENDPOINTS } from "@/lib/api-config";
import { Search, MessageSquare, Send, Info, MoreVertical, Plus } from "lucide-react";
import Link from "next/link";

interface GroupChat {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  members: any[];
}

export default function MessagesPage() {
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGroupChats();
  }, []);

  const fetchGroupChats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.GROUPS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const groups = data.groups || [];
        setGroupChats(groups);
        if (groups.length > 0) {
          setSelectedChat(groups[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = groupChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ChatList = () => (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Messenger"
            className="pl-10 rounded-full bg-slate-100 border-none h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedChat?.id === chat.id ? "bg-slate-100" : ""
              }`}
          >
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-slate-200 text-slate-500">
                {chat.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold truncate">{chat.name}</h3>
                <span className="text-xs text-slate-400">{chat.lastMessageTime}</span>
              </div>
              <p className="text-slate-500 text-sm truncate">
                {chat.lastMessage || "No messages yet"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ActiveChat = () => (
    <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-12rem)] flex flex-col">
      {selectedChat ? (
        <>
          {/* Chat Header */}
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{selectedChat.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h3 className="font-bold">{selectedChat.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Info size={20} className="text-primary" /></Button>
              <Button variant="ghost" size="icon"><MoreVertical size={20} /></Button>
            </div>
          </div>

          {/* Messages Area (Dummy Data) */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-4">
            <div className="flex justify-center my-4">
              <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">Today</span>
            </div>
            <div className="flex items-start gap-2 max-w-[80%]">
              <Avatar className="h-8 w-8">
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm">
                <p className="text-sm">Hello! How is everyone doing today? 🙏</p>
                <span className="text-[10px] text-slate-400 mt-1">10:30 AM</span>
              </div>
            </div>
            <div className="flex items-start gap-2 max-w-[80%] self-end flex-row-reverse">
              <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none shadow-sm">
                <p className="text-sm">We are doing great, thank God! Just preparing for the evening service.</p>
                <span className="text-[10px] text-primary-foreground/70 mt-1">10:32 AM</span>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t flex items-center gap-2">
            <Plus className="text-primary cursor-pointer" />
            <Input
              placeholder="Aa"
              className="rounded-full bg-slate-100 border-none h-10"
            />
            <Button size="icon" className="rounded-full bg-primary h-10 w-10">
              <Send size={18} />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <MessageSquare size={64} className="mb-4 opacity-20" />
          <p>Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );

  const ProfileView = () => (
    <div className="bg-white rounded-lg shadow-sm border h-full p-6 flex flex-col items-center">
      {selectedChat ? (
        <>
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback className="text-2xl">{selectedChat.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold">{selectedChat.name}</h2>
          <p className="text-slate-500 text-sm mb-6">Group Chat</p>

          <div className="w-full space-y-4">
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
              <span className="font-medium">Theme</span>
              <div className="w-4 h-4 rounded-full bg-primary"></div>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
              <span className="font-medium">Media, Files & Links</span>
              <Info size={18} className="text-slate-400" />
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-red-600">
              <span className="font-medium">Leave Group</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-slate-400 mt-20">No profile selected</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 md:pb-0">
      <Header />
      <PageGrid
        left={<ChatList />}
        center={<ActiveChat />}
        right={<ProfileView />}
      />
      <BottomNav />
    </div>
  );
}
