import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ENDPOINTS } from "@/lib/api-config";
import {
  Search, MessageSquare, Send, Info, MoreVertical, Plus,
  Mic, Smile, Phone, Video as VideoIcon, ChevronLeft,
  Flag, LogOut, ShieldAlert, Trash2, Volume2, Heart,
  Users as UsersIcon, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface GroupChat {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  members: any[];
}

const EMOJIS = ["🙏", "🙌", "✨", "❤️", "😊", "🔥", "🤝", "📖", "⛪", "🕊️", "😇", "💡", "💪", "🌈", "🎵", "✍️"];

export default function MessagesPage() {
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGroupChats();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChat, mobileView]);

  const fetchGroupChats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.GROUPS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const groups = data.groups || [];
        setGroupChats(groups);
        if (groups.length > 0 && !selectedChat) {
          setSelectedChat(groups[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chat: GroupChat) => {
    setSelectedChat(chat);
    setMobileView("chat");
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.info("Recording voice note...");
    } else {
      toast.success("Voice note captured (dummy)");
    }
  };

  const handleAction = (action: string) => {
    toast.info(`${action} clicked! (Coming soon)`);
  };

  const filteredChats = groupChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ChatList = () => (
    <div className={`bg-white rounded-xl shadow-sm border h-[calc(100vh-8rem)] flex flex-col ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Messages</h2>
          <Button variant="ghost" size="icon" className="bg-slate-100 rounded-full hover:bg-[#800517] hover:text-white transition-all">
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
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800517]"></div>
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${selectedChat?.id === chat.id ? "bg-slate-100 ring-1 ring-slate-200" : "hover:bg-slate-50"
                }`}
            >
              <div className="relative">
                <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-slate-200 text-[#800517] font-bold text-xl">
                    {chat.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-slate-800 truncate">{chat.name}</h3>
                  <span className="text-[10px] font-medium text-slate-400">{chat.lastMessageTime || "12:45 PM"}</span>
                </div>
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

  const ActiveChat = () => (
    <div className={`bg-white rounded-xl shadow-sm border h-[calc(100vh-8rem)] flex flex-col relative ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
      {selectedChat ? (
        <>
          {/* Chat Header */}
          <div className="p-3 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 rounded-t-xl">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileView("list")}
              >
                <ChevronLeft size={24} />
              </Button>
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-slate-100">
                  <AvatarFallback className="bg-slate-100 text-[#800517] font-bold">
                    {selectedChat.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">{selectedChat.name}</h3>
                <p className="text-[10px] text-green-500 font-medium">Active now</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-[#800517] hover:bg-red-50"
                onClick={() => handleAction("Live Call")}
                title="Start Life Call (Live Chat)"
              >
                <Volume2 size={20} />
              </Button>

              {/* Info Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#800517] hover:bg-red-50">
                    <Info size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 rounded-xl" align="end">
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Group Info</div>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm" onClick={() => handleAction("View Members")}>
                      <UsersIcon size={16} /> Members
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm text-red-600 hover:bg-red-50" onClick={() => handleAction("Leave Group")}>
                      <LogOut size={16} /> Leave Group
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm text-orange-600 hover:bg-orange-50" onClick={() => handleAction("Report Group")}>
                      <ShieldAlert size={16} /> Report
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-50">
                    <MoreVertical size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 rounded-xl" align="end">
                  <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm" onClick={() => handleAction("Search in Conversation")}>
                      <Search size={16} /> Search Chat
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm" onClick={() => handleAction("Mute Notifications")}>
                      <Volume2 size={16} /> Mute
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm text-red-600" onClick={() => handleAction("Clear History")}>
                      <Trash2 size={16} /> Clear Chat
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-[#F7F8FA] flex flex-col gap-4 custom-scrollbar">
            <div className="flex justify-center my-6">
              <span className="text-[10px] font-bold bg-white px-3 py-1 rounded-full text-slate-400 shadow-sm uppercase tracking-widest border">Today</span>
            </div>

            {/* Dummy Messages */}
            <div className="flex items-end gap-2 max-w-[85%]">
              <Avatar className="h-7 w-7 mb-1">
                <AvatarFallback className="text-[10px]">A</AvatarFallback>
              </Avatar>
              <div className="bg-white p-3 px-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100">
                <p className="text-[13px] leading-relaxed text-slate-700">Blessings everyone! The Sunday sermon notes are ready in the community library. 🙏</p>
                <span className="text-[9px] text-slate-400 mt-1 block font-medium">10:30 AM</span>
              </div>
            </div>

            <div className="flex items-end gap-2 max-w-[85%] self-end flex-row-reverse">
              <div className="bg-[#800517] text-white p-3 px-4 rounded-2xl rounded-br-none shadow-md">
                <p className="text-[13px] leading-relaxed">Thank you Pastor! We are studying them now. Great word! 🔥</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className="text-[9px] text-white/70 font-medium">10:32 AM</span>
                  <div className="h-1 w-1 bg-white/50 rounded-full"></div>
                </div>
              </div>
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 self-end bg-red-50 border border-red-100 p-2 px-4 rounded-full animate-pulse">
                <Mic size={14} className="text-red-500" />
                <span className="text-xs font-bold text-red-600">Recording... 00:0{Math.floor(Math.random() * 9)}</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white rounded-b-xl">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#800517] hover:bg-red-50 rounded-full shrink-0">
                    <Plus size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-max p-2 rounded-2xl" side="top" align="start">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-500"><ImageIcon size={20} /></Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-orange-500"><Phone size={20} /></Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-green-500"><VideoIcon size={20} /></Button>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-3 gap-2 border border-transparent focus-within:border-slate-200 transition-all">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#800517] h-8 w-8 hover:bg-transparent">
                      <Smile size={20} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 rounded-2xl shadow-xl" side="top">
                    <div className="grid grid-cols-4 gap-2">
                      {EMOJIS.map(e => (
                        <button
                          key={e}
                          onClick={() => handleEmojiClick(e)}
                          className="text-2xl hover:bg-slate-50 p-1 rounded-lg transition-transform hover:scale-125"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Input
                  placeholder="Aa"
                  className="bg-transparent border-none focus-visible:ring-0 shadow-none h-10 px-0 text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAction("Send")}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-full transition-colors ${isRecording ? "text-red-500 bg-red-50" : "text-slate-400 hover:text-[#800517]"}`}
                  onClick={toggleRecording}
                >
                  <Mic size={20} />
                </Button>
              </div>

              {message.trim() ? (
                <Button
                  size="icon"
                  className="rounded-full bg-[#800517] h-10 w-10 shrink-0 shadow-md hover:bg-[#A0061D]"
                  onClick={() => { setMessage(""); toast.success("Sent!"); }}
                >
                  <Send size={18} />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="text-[#800517] shrink-0" onClick={() => handleAction("Like")}>
                  <Heart size={20} />
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={48} className="opacity-20" />
          </div>
          <h3 className="font-bold text-slate-400">Your Spiritual Sanctuary</h3>
          <p className="text-xs">Select a chat to start connecting with believers</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 md:pb-0 overflow-hidden">
      <Header />
      <PageGrid
        left={<ChatList />}
        center={<ActiveChat />}
        right={<div className="hidden lg:block h-full"><ProfileView selectedChat={selectedChat} handleAction={handleAction} /></div>}
      />
      <BottomNav />
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}

function ProfileView({ selectedChat, handleAction }: { selectedChat: GroupChat | null, handleAction: (a: string) => void }) {
  if (!selectedChat) return (
    <div className="bg-white rounded-xl shadow-sm border h-[calc(100vh-8rem)] p-6 flex flex-col items-center justify-center text-slate-300">
      <UsersIcon size={48} className="opacity-20 mb-2" />
      <p className="text-sm">Select a group to see info</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border h-[calc(100vh-8rem)] p-6 flex flex-col items-center overflow-y-auto custom-scrollbar">
      <Avatar className="h-24 w-24 mb-4 ring-4 ring-slate-50 shadow-md">
        <AvatarFallback className="text-3xl font-bold bg-slate-100 text-[#800517]">{selectedChat.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <h2 className="text-xl font-bold text-slate-800 text-center">{selectedChat.name}</h2>
      <p className="text-green-500 text-xs font-bold mb-8 flex items-center gap-1">
        <div className="h-2 w-2 bg-green-500 rounded-full"></div> Group Chat
      </p>

      <div className="w-full space-y-2">
        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Options</div>
        <div onClick={() => handleAction("Theme")} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Theme</span>
          <div className="w-4 h-4 rounded-full bg-[#800517]"></div>
        </div>
        <div onClick={() => handleAction("Media")} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Media & Files</span>
          <Info size={16} className="text-slate-300 group-hover:text-[#800517]" />
        </div>
        <div onClick={() => handleAction("Search")} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Search Conversation</span>
          <Search size={16} className="text-slate-300 group-hover:text-[#800517]" />
        </div>

        <div className="pt-4 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Privacy & Support</div>
        <div onClick={() => handleAction("Mute")} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Mute Notifications</span>
          <Volume2 size={16} className="text-slate-300" />
        </div>
        <div onClick={() => handleAction("Report")} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-xl cursor-pointer transition-colors group">
          <span className="text-sm font-semibold text-red-500">Report Group</span>
          <Flag size={16} className="text-red-300" />
        </div>
        <div onClick={() => handleAction("Leave")} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-xl cursor-pointer transition-colors group">
          <span className="text-sm font-semibold text-red-600">Leave Group</span>
          <LogOut size={16} className="text-red-400" />
        </div>
      </div>
    </div>
  );
}
