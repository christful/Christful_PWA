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
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <h1 className="text-3xl font-bold mb-8">Messages</h1>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Chats List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredChats.length > 0 ? (
            <div className="space-y-2">
              {filteredChats.map((chat) => (
                <Link key={chat.id} href={`/groups/${chat.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {chat.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{chat.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {chat.lastMessage || "No messages yet"}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {chat.lastMessageTime || ""}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? "No conversations found" : "No messages yet"}
              </p>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}