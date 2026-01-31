"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft, Send, MoreHorizontal } from "lucide-react";

interface GroupMessage {
  id: string;
  content: string;
  sender: {
    id: string; // Ensure we have ID for alignment
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

  // Fetch current user ID to determine message alignment
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to get user ID from local storage or decode token if possible
    // For now, we'll fetch 'ME'
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          const response = await fetch(ENDPOINTS.ME, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setCurrentUserId(data.user?.id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch me", e);
      }
    };
    fetchMe();
  }, []);

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
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageInput }),
      });

      if (response.ok) {
        setMessageInput("");
        await fetchMessages();
        // toast.success("Message sent!"); // Optional: WhatsApp usually doesn't toast on send, just shows it, but we can keep it if desired or remove for cleaner UI
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
    <div className="min-h-screen bg-[#E5DDD5] flex flex-col relative">
      {/* Fixed Header */}
      <div className="bg-[#075E54] text-white fixed top-0 w-full z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarFallback className="bg-primary-foreground text-primary font-bold">
                {group.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold text-lg leading-tight">{group.name}</h1>
              <p className="text-xs text-white/80">
                {group.members.length} members
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full">
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 pt-24 pb-24 overflow-y-auto px-4 md:px-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isMe = message.sender.id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  {!isMe && (
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                      <AvatarImage src={message.sender.avatarUrl} />
                      <AvatarFallback>{message.sender.firstName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-2 shadow-sm relative ${isMe
                      ? 'bg-[#DCF8C6] rounded-tr-none text-gray-800'
                      : 'bg-white rounded-tl-none text-gray-800'
                      }`}
                  >
                    {!isMe && (
                      <p className={`text-xs font-bold mb-1 ${isMe ? 'text-green-700' : 'text-blue-600'}`}>
                        {message.sender.firstName} {message.sender.lastName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p className="text-[10px] text-gray-500 text-right mt-1 ml-4 block selection:bg-none">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 mt-10">
              <div className="bg-[#DCF8C6] p-4 rounded-full mb-4 shadow-sm opacity-80">
                <Send className="h-8 w-8 text-[#075E54]" />
              </div>
              <p className="text-gray-500 text-center bg-white/80 px-4 py-2 rounded-lg shadow-sm">
                No messages yet.<br />Be the first to say hello!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full bg-[#F0F0F0] border-t border-gray-200 z-10 px-4 py-3 pb-safe-area">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 shadow-sm border border-gray-100 focus-within:ring-1 focus-within:ring-green-500 transition-all">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="border-none shadow-none focus-visible:ring-0 p-0 text-base h-auto max-h-32 placeholder:text-gray-400"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 rounded-full bg-[#075E54] hover:bg-[#128C7E] shadow-md transition-transform active:scale-95 flex-shrink-0"
              disabled={!messageInput.trim()}
            >
              <Send className="h-5 w-5 text-white ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}