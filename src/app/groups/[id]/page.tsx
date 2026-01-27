"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft, Send, MoreHorizontal } from "lucide-react";

interface GroupMessage {
  id: string;
  content: string;
  sender: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
  };
  createdAt: string;
  reactions?: any[];
}

interface Group {
  id: string;
  name: string;
  description: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  members: any[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetail();
      fetchMessages();
    }
  }, [groupId]);

  const fetchGroupDetail = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.GROUP_DETAIL(groupId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroup(data);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
      toast.error("Failed to load group");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.GROUP_MESSAGES(groupId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.GROUP_MESSAGES(groupId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageInput }),
      });

      if (response.ok) {
        setMessageInput("");
        await fetchMessages();
        toast.success("Message sent!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0 flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col pt-20">
        <div className="max-w-4xl mx-auto w-full h-full px-4 flex flex-col">
          {/* Group Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-secondary rounded-full"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{group.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {group.members?.length || 0} members
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-secondary rounded-full">
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={message.sender.avatarUrl} />
                    <AvatarFallback>
                      {message.sender.firstName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">
                        {message.sender.firstName} {message.sender.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-sm text-foreground mt-1">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Message Input (Fixed at bottom) */}
      <div className="fixed bottom-20 md:static left-0 right-0 bg-white border-t p-4 md:border-0 md:p-0 md:mt-6">
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" className="flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}