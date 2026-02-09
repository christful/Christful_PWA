"use client"
import { useEffect, useState, useRef, useCallback } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ENDPOINTS } from "@/lib/api-config";
import {
  Search, MessageSquare, Send, Info, MoreVertical, Plus,
  Mic, Smile, Phone, Video as VideoIcon, ChevronLeft,
  Flag, LogOut, ShieldAlert, Trash2, Volume2, Heart,
  Users as UsersIcon, Image as ImageIcon, User, Book
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";

interface GroupChat {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  members: any[];
  communityId?: string;
  communityName?: string;
}

const EMOJIS = ["🙏", "🙌", "✨", "❤️", "😊", "🔥", "🤝", "📖", "⛪", "🕊️", "😇", "💡", "💪", "🌈", "🎵", "✍️"];

const BIBLE_VERSES = [
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son..." },
  { ref: "Psalm 23:1", text: "The LORD is my shepherd; I shall not want." },
  { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
  { ref: "Proverbs 3:5", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God..." },
  { ref: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
];

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupAvatar, setNewGroupAvatar] = useState<File | null>(null);
  const [isScriptureModalOpen, setIsScriptureModalOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Standalone Groups
  const { data: groupsData, isLoading: groupsLoading, mutate: mutateGroups } = useApi<{ groups: GroupChat[] }>(
    ENDPOINTS.GROUPS,
    { refreshInterval: 30000 }
  );

  // Fetch Communities to get their groups
  const { data: communitiesData, isLoading: communitiesLoading } = useApi<{ communities: any[] }>(
    ENDPOINTS.COMMUNITIES,
    { refreshInterval: 60000 }
  );

  const chatsLoading = groupsLoading || communitiesLoading;

  const [allChats, setAllChats] = useState<GroupChat[]>([]);

  useEffect(() => {
    const standaloneGroups = groupsData?.groups || [];
    const communityGroups: GroupChat[] = [];

    if (communitiesData?.communities) {
      communitiesData.communities.forEach((community: any) => {
        if (community.groups && Array.isArray(community.groups)) {
          community.groups.forEach((group: any) => {
            communityGroups.push({
              ...group,
              communityId: community.id,
              communityName: community.name
            });
          });
        }
      });
    }

    // Combine and remove duplicates by ID
    const combined = [...standaloneGroups, ...communityGroups];
    const unique = combined.reduce((acc: GroupChat[], current) => {
      const x = acc.find(item => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    setAllChats(unique);
  }, [groupsData, communitiesData]);

  const groupChats = allChats;

  // Fetch Messages with SWR
  const { data: messagesData, mutate: mutateMessages } = useApi<{ messages: any[] }>(
    selectedChat ? ENDPOINTS.GROUP_MESSAGES(selectedChat.id) : null,
    { refreshInterval: 2000 }
  );

  const messages = messagesData?.messages || [];

  useEffect(() => {
    // Select first chat if none selected and chats loaded
    if (groupChats.length > 0 && !selectedChat) {
      setSelectedChat(groupChats[0]);
    }
  }, [groupChats, selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mobileView]);

  const handleSelectChat = (chat: GroupChat) => {
    setSelectedChat(chat);
    setMobileView("chat");
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setAudioBlob(null); // Clear previous recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const chunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());

          // Ask if they want to send it
          toast.success("Voice note captured!", {
            action: {
              label: "Send",
              onClick: () => handleSendMessage("", blob)
            },
          });
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Recording error:", err);
        toast.error("Could not access microphone");
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("name", newGroupName);
      formData.append("description", newGroupDescription);
      if (newGroupAvatar) {
        formData.append("avatar", newGroupAvatar);
      }

      const response = await fetch(ENDPOINTS.GROUPS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (response.ok) {
        toast.success("Group created successfully!");
        setIsCreateModalOpen(false);
        setNewGroupName("");
        setNewGroupDescription("");
        setNewGroupAvatar(null);
        mutateGroups();
      } else {
        toast.error("Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("An error occurred");
    }
  };

  const handleSendMessage = async (content: string, audio?: Blob) => {
    if ((!content.trim() && !audio) || !selectedChat) return;

    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      if (content.trim()) formData.append("content", content);
      if (audio) formData.append("audio", audio, "voice-note.webm");

      const response = await fetch(ENDPOINTS.GROUP_MESSAGES(selectedChat.id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setMessage("");
        setAudioBlob(null);
        mutateMessages(); // Instant update with SWR
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("An error occurred");
    }
  };

  const handleSendScripture = (verse: any) => {
    const content = `📖 ${verse.ref}: "${verse.text}"`;
    handleSendMessage(content);
    setIsScriptureModalOpen(false);
  };

  const filteredChats = groupChats.filter((chat: any) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 md:pb-0 overflow-hidden">
      <Header />
      <PageGrid
        left={
          <ChatList
            chats={filteredChats}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            isLoading={chatsLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            mobileView={mobileView}
          />
        }
        center={
          <ActiveChat
            selectedChat={selectedChat}
            messages={messages}
            message={message}
            setMessage={setMessage}
            onSendMessage={handleSendMessage}
            onSendScripture={handleSendScripture}
            onEmojiClick={handleEmojiClick}
            toggleRecording={toggleRecording}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            audioBlob={audioBlob}
            setAudioBlob={setAudioBlob}
            isScriptureModalOpen={isScriptureModalOpen}
            setIsScriptureModalOpen={setIsScriptureModalOpen}
            mobileView={mobileView}
            setMobileView={setMobileView}
            scrollRef={scrollRef}
          />
        }
        right={
          <div className="hidden lg:block h-full">
            <ProfileView
              selectedChat={selectedChat}
            />
          </div>
        }
        leftMobileVisibility={mobileView === "list" ? "block" : "hidden"}
        centerMobileVisibility={mobileView === "chat" ? "block" : "hidden"}
      />

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">New Group</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} className="rounded-full">
                <Plus size={20} className="rotate-45" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Group Name</label>
                <Input
                  placeholder="e.g. Prayer Warriors"
                  className="rounded-xl bg-slate-50 border-slate-200 h-12 focus-visible:ring-[#800517]"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#800517] min-h-[80px] transition-all"
                  placeholder="What is this group about?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Group Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {newGroupAvatar ? (
                      <img src={URL.createObjectURL(newGroupAvatar)} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-300" />
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewGroupAvatar(e.target.files?.[0] || null)}
                    className="flex-1 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <Button variant="ghost" className="rounded-full px-6" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button className="bg-[#800517] hover:bg-[#a0061d] rounded-full px-8 font-bold shadow-lg shadow-red-100" onClick={handleCreateGroup}>Create Group</Button>
              </div>
            </div>
          </div>
        </div>
      )}
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

// Sub-components moved outside to fix the "one character" typing bug (component re-mounting)
function ChatList({ chats, selectedChat, onSelectChat, isLoading, searchQuery, setSearchQuery, onOpenCreateModal, mobileView }: any) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border h-[calc(100vh-8rem)] flex flex-col ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
      <div className="p-4 border-b">
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
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800517]"></div>
          </div>
        ) : chats.length > 0 ? (
          chats.map((chat: any) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${selectedChat?.id === chat.id ? "bg-slate-100 ring-1 ring-slate-200" : "hover:bg-slate-50"
                }`}
            >
              <div className="relative">
                <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-slate-200 text-[#800517] font-bold text-xl">
                    {chat.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {chat.communityId && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#800517] border-2 border-white rounded-lg flex items-center justify-center shadow-sm" title={`Community: ${chat.communityName}`}>
                    <UsersIcon size={12} className="text-white" />
                  </div>
                )}
                {!chat.communityId && <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>}
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

function ActiveChat({
  selectedChat,
  messages,
  message,
  setMessage,
  onSendMessage,
  onSendScripture,
  onEmojiClick,
  toggleRecording,
  isRecording,
  recordingDuration,
  audioBlob,
  setAudioBlob,
  isScriptureModalOpen,
  setIsScriptureModalOpen,
  mobileView,
  setMobileView,
  scrollRef
}: any) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border h-[calc(100vh-8rem)] flex flex-col relative ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
      {selectedChat ? (
        <>
          <div className="p-3 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 rounded-t-xl">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileView("list")}>
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
              <Button variant="ghost" size="icon" className="text-[#800517] hover:bg-red-50" onClick={() => toast.info("Call clicked")}>
                <Volume2 size={20} />
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-[#F7F8FA] flex flex-col gap-1 custom-scrollbar">
            {messages.length > 0 ? (
              messages.map((msg: any, idx: number) => (
                <MessageBubble
                  key={msg.id || idx}
                  content={msg.content}
                  senderName={msg.sender?.firstName || msg.authorName || "User"}
                  isMe={msg.senderId === localStorage.getItem("userId") || msg.authorId === localStorage.getItem("userId")}
                  timestamp={msg.createdAt}
                  avatarUrl={msg.sender?.avatarUrl || msg.authorAvatar}
                  audioUrl={msg.audioUrl}
                />
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
                <p className="text-sm italic">No messages yet. Start the conversation!</p>
              </div>
            )}
            {isRecording && (
              <div className="flex items-center gap-2 self-end bg-red-50 border border-red-100 p-2 px-4 rounded-full animate-pulse shadow-sm">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
                <span className="text-xs font-bold text-red-600">Recording... {formatDuration(recordingDuration)}</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-white rounded-b-xl">
            <div className="flex items-center gap-2">
              <Popover open={isScriptureModalOpen} onOpenChange={setIsScriptureModalOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#800517] hover:bg-red-50 rounded-full shrink-0">
                    <Plus size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl" side="top" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-slate-900">Share</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="ghost"
                        className="flex flex-col h-auto py-4 gap-2 rounded-2xl hover:bg-slate-50"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // In a real app, you'd upload this. For now, we simulate.
                              toast.info(`Uploading image: ${file.name}`);
                              onSendMessage(`[Image: ${file.name}]`);
                              setIsScriptureModalOpen(false);
                            }
                          };
                          input.click();
                        }}
                      >
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                          <ImageIcon size={24} />
                        </div>
                        <span className="text-xs font-bold">Photo</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex flex-col h-auto py-4 gap-2 rounded-2xl hover:bg-slate-50"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'video/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              toast.info(`Uploading video: ${file.name}`);
                              onSendMessage(`[Video: ${file.name}]`);
                              setIsScriptureModalOpen(false);
                            }
                          };
                          input.click();
                        }}
                      >
                        <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                          <VideoIcon size={24} />
                        </div>
                        <span className="text-xs font-bold">Video</span>
                      </Button>
                    </div>
                    <div className="space-y-3 pt-2 border-t">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Book size={18} className="text-[#800517]" />
                        Share Scripture
                      </h3>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {BIBLE_VERSES.map((v: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => onSendScripture(v)}
                            className="text-left p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                          >
                            <p className="text-[10px] font-bold text-[#800517] mb-0.5">{v.ref}</p>
                            <p className="text-[10px] text-slate-600 line-clamp-1">{v.text}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-3 gap-2 border border-transparent focus-within:border-slate-200 transition-all relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#800517] h-8 w-8 hover:bg-transparent">
                      <Smile size={20} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 rounded-2xl shadow-xl" side="top">
                    <div className="grid grid-cols-4 gap-2">
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => onEmojiClick(e)} className="text-2xl hover:bg-slate-50 p-1 rounded-lg transition-transform hover:scale-125">
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
                  onKeyPress={(e) => e.key === "Enter" && onSendMessage(message)}
                  autoFocus
                />
              </div>

              {isRecording ? (
                <div className="flex items-center gap-2 bg-red-100 p-2 px-3 rounded-full animate-pulse shadow-sm min-w-[120px] justify-between">
                  <span className="text-xs font-bold text-red-600">{formatDuration(recordingDuration)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-200 rounded-full" onClick={() => { toggleRecording(); setAudioBlob(null); }}>
                      <Trash2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-200 rounded-full" onClick={toggleRecording}>
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-slate-400 hover:text-[#800517] hover:bg-red-50"
                    onClick={toggleRecording}
                  >
                    <Mic size={20} />
                  </Button>
                  {(message.trim() || audioBlob) && (
                    <Button
                      size="icon"
                      className="rounded-full bg-[#800517] h-10 w-10 shrink-0 shadow-md hover:bg-[#A0061D]"
                      onClick={() => onSendMessage(message, audioBlob || undefined)}
                    >
                      <Send size={18} />
                    </Button>
                  )}
                </div>
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
}

function ProfileView({ selectedChat }: any) {
  const handleShareLink = async () => {
    if (!selectedChat) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.GROUP_INVITE_LINK(selectedChat.id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const inviteLink = data.inviteLink || `${window.location.origin}/groups/join/${selectedChat.id}`;
        await navigator.clipboard.writeText(inviteLink);
        toast.success("Invite link copied to clipboard!");
      } else {
        toast.error("Failed to get invite link");
      }
    } catch (error) {
      console.error("Invite error:", error);
      toast.error("An error occurred");
    }
  };

  if (!selectedChat) return (
    <div className="bg-white rounded-xl shadow-sm border h-[calc(100vh-8rem)] p-6 flex flex-col items-center justify-center text-slate-300">
      <MessageSquare size={48} className="opacity-10 mb-4" />
      <p className="text-sm font-medium text-slate-400">Select a conversation</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-center pt-8 pb-6 px-4">
          <Avatar className="h-24 w-24 mb-4 ring-4 ring-slate-50 shadow-md">
            <AvatarFallback className="text-3xl font-bold bg-slate-100 text-[#800517]">
              {selectedChat.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-slate-900 text-center mb-1">{selectedChat.name}</h2>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>Active now</span>
          </div>
        </div>
        <div className="px-6 space-y-3 pb-6">
          <Button
            className="w-full h-11 bg-[#800517] hover:bg-[#a0061d] font-bold rounded-xl shadow-sm"
            onClick={handleShareLink}
          >
            Share Group Link
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 font-bold text-red-600 border-red-50 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all"
            onClick={() => toast.info("Leave Group clicked!")}
          >
            Leave Group
          </Button>
        </div>
      </div>
    </div>
  );
}
