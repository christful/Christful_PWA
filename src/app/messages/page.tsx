"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ENDPOINTS } from "@/lib/api-config";
import { Search, MessageSquare } from "lucide-react";
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
        // Filter for group chats
        setGroupChats(data.groups || []);
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

  return (
    <div className="min-h-screen bg-white">
      {/* WhatsApp-style Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-[#075E54] text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-[60px] max-w-4xl mx-auto">
          <h1 className="text-xl font-bold">Messages</h1>
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 cursor-pointer" />
            <MessageSquare className="h-5 w-5 cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="pt-[60px] pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="p-3 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 rounded-lg bg-slate-100 border-none h-10 focus-visible:ring-1 focus-visible:ring-[#075E54]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Chats List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#075E54]"></div>
            </div>
          ) : filteredChats.length > 0 ? (
            <div className="bg-white">
              {filteredChats.map((chat) => (
                <Link key={chat.id} href={`/groups/${chat.id}`}>
                   <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-slate-200 text-slate-500 font-medium text-lg">
                        {chat.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-slate-900 truncate text-[17px]">
                          {chat.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
                          {chat.lastMessageTime}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-slate-500 text-sm truncate leading-5 flex-1">
                             {chat.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center">
              <MessageSquare className="h-12 w-12 mb-4 text-slate-300" />
              <p className="text-muted-foreground">
                {searchQuery ? "No conversations found" : "No messages yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}