"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft, Send, MoreHorizontal } from "lucide-react";
import { MessageBubble } from "@/components/ui/message-bubble";

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
          const response = await fetch(ENDPOINTS.AUTH_ME, {
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
    <div className="fixed inset-0 bg-[#efeae2] flex flex-col z-50">
      {/* WhatsApp Chat Header */}
      <div className="bg-[#075E54] px-4 py-2 flex items-center justify-between text-white shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1 -ml-2 rounded-full hover:bg-white/10">
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-3 cursor-pointer">
            <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarFallback className="bg-slate-200 text-slate-500 font-medium">
                {group.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center">
              <h1 className="font-semibold text-base leading-none mb-1">{group.name}</h1>
              <p className="text-xs text-slate-300 leading-none truncate max-w-[150px]">
                {group.members.map(m => m.firstName).join(", ")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Placeholder icons for video/call */}
          <div className="bg-transparent w-6 h-6 rounded-full" />
          <div className="bg-transparent w-6 h-6 rounded-full" />
          <MoreHorizontal className="h-5 w-5" />
        </div>
      </div>

      {/* Chat Background & Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-100"
        style={{ backgroundColor: '#efeae2' }} // Fallback
      >
        {messages.length > 0 ? (
          <div className="flex flex-col justify-end min-h-full pb-2">
            {messages.map((message) => {
              const isMe = message.sender.id === currentUserId;
              return (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  senderName={`${message.sender.firstName} ${message.sender.lastName}`}
                  isMe={isMe}
                  timestamp={new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  avatarUrl={message.sender.avatarUrl}
                  status="read" // Hardcoded for demo
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-[#dcf8c6] p-4 rounded-full mb-4 shadow-sm">
              <Send className="h-8 w-8 text-[#075E54]" />
            </div>
            <p className="text-gray-500 text-sm bg-[#e9edef] px-3 py-1 rounded-lg shadow-sm">
              Messages to this group are now secured with end-to-end encryption used for demo purposes.
            </p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] px-2 py-2 flex items-center gap-2 flex-shrink-0 pb-safe-area">
        <Button size="icon" variant="ghost" className="text-gray-500 rounded-full h-10 w-10">
          {/* Smiley Icon Placeholder */}
          <span className="text-xl">😊</span>
        </Button>
        <Button size="icon" variant="ghost" className="text-gray-500 rounded-full h-10 w-10">
          <span className="text-xl font-bold">+</span>
        </Button>

        <form onSubmit={handleSendMessage} className="flex-1 flex gap-2 items-center">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 bg-white border-none shadow-sm rounded-lg px-4 py-2 focus-visible:ring-0 text-base"
          />
          {messageInput.trim() ? (
            <Button
              type="submit"
              size="icon"
              className="bg-[#075E54] hover:bg-[#128C7E] text-white rounded-full h-10 w-10 shadow-md transition-transform active:scale-95"
            >
              <Send className="h-5 w-5 ml-0.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-gray-500 rounded-full h-10 w-10"
            >
              {/* Mic Icon Placeholder */}
              <span className="text-xl">🎤</span>
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}