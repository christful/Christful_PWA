"use client"
import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ENDPOINTS } from "@/lib/api-config";
import {
  Search, MessageSquare, Send, Plus,
  Mic, Smile, Video as VideoIcon, ChevronLeft,
  Trash2, Volume2, Users as UsersIcon, Image as ImageIcon, Book, X, Music
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";

interface GroupChat {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  members: any[];
  communityId?: string;
  communityName?: string;
}

interface Message {
  id: string;
  content?: string;
  sender?: {
    id: string;
    firstName: string;
    avatarUrl?: string;
  };
  authorName?: string;
  authorAvatar?: string;
  createdAt: string;
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  status?: "sent" | "delivered" | "read";
}

const EMOJIS = ["🙏", "🙌", "✨", "❤️", "😊", "😂", "🔥", "🤝", "📖", "⛪", "🕊️", "😇", "💡", "💪", "🌈", "🎵", "✍️"];

const BIBLE_VERSES = [
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son..." },
  { ref: "Psalm 23:1", text: "The LORD is my shepherd; I shall not want." },
  { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
  { ref: "Proverbs 3:5", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God..." },
  { ref: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
];

export default function MessagesContent() {
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
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const { data: recentMessagesData, isLoading: chatsLoading, mutate: mutateGroups } = useApi<{ groups: GroupChat[] }>(
    ENDPOINTS.GROUPS_WITH_RECENT_MESSAGES,
    { refreshInterval: 30000 }
  );

  const groupChats = recentMessagesData?.groups || [];

  const searchParams = useSearchParams();

  const { data: messagesData, mutate: mutateMessages } = useApi<{ messages: Message[] }>(
    selectedChat ? ENDPOINTS.GROUP_MESSAGES(selectedChat.id) : null,
    { refreshInterval: 2000 }
  );

  const messages = messagesData?.messages || [];

  useEffect(() => {
    if (groupChats.length > 0 && !selectedChat) {
      const param = searchParams?.get("groupId");
      if (param) {
        const match = groupChats.find((g: any) => g.id === param);
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        const isMember = match && (match.members?.some((m: any) => m.id === userId) || match.members?.includes?.(userId));
        if (match) {
          if (isMember) {
            setSelectedChat(match);
          } else {
            toast.error("You must join this group to view messages.");
            setSelectedChat(groupChats[0]);
          }
          return;
        }
      }
      setSelectedChat(groupChats[0]);
    }
  }, [groupChats, selectedChat, searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      setAudioBlob(null);
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
    if ((!content.trim() && !audio && !selectedMedia) || !selectedChat) return;

    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();

      if (content.trim()) {
        formData.append("content", content);
      }

      // Handle voice note (audio blob from recording)
      if (audio) {
        formData.append("audio", audio, "voice-note.webm");
      }

      // Handle selected media file (image, video, or audio file)
      if (selectedMedia) {
        const fieldName = mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : 'audio';
        formData.append(fieldName, selectedMedia);
      }

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
        setSelectedMedia(null);
        setMediaPreview(null);
        setMediaType(null);
        mutateMessages();
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

  const handleMediaSelect = (type: 'image' | 'video' | 'audio') => {
    if (type === 'image') {
      fileInputRef.current?.click();
    } else if (type === 'video') {
      videoInputRef.current?.click();
    } else {
      audioInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = type === 'image' ? 10 * 1024 * 1024 : type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // audio 10MB
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${type === 'image' ? '10MB' : type === 'video' ? '50MB' : '10MB'}`);
      return;
    }

    setSelectedMedia(file);
    setMediaType(type);
    if (type === 'image' || type === 'video') {
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
    } else {
      // For audio, just show file name as preview?
      setMediaPreview(null);
      toast.info(`Selected audio: ${file.name}`);
    }
    // Auto-send after selection (optional, can also add a send button)
    handleSendMessage("", undefined);
  };

  const filteredChats = groupChats.filter((chat: any) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#F0F2F5] min-h-screen pt-16 md:pt-20">
      <Header />
      
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/*"
        onChange={(e) => handleFileChange(e, 'video')}
      />
      <input
        type="file"
        ref={audioInputRef}
        className="hidden"
        accept="audio/*"
        onChange={(e) => handleFileChange(e, 'audio')}
      />

      <div className="container mx-auto h-[calc(100vh-8rem)] px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Chat List - Left Column (1/3 width on desktop) */}
          <div className={`${mobileView === "chat" ? "hidden md:block" : "block"} md:col-span-1 h-full`}>
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
          </div>

          {/* Active Chat - Right Column (2/3 width on desktop) */}
          <div className={`${mobileView === "list" ? "hidden md:block" : "block"} md:col-span-2 h-full`}>
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
              onMediaSelect={handleMediaSelect}
              mediaPreview={mediaPreview}
              selectedMedia={selectedMedia}
              setSelectedMedia={setSelectedMedia}
              setMediaPreview={setMediaPreview}
            />
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">New Group</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} className="rounded-full">
                <X size={20} />
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
    </div>
  );
}

// ChatList component (simplified without borders)
function ChatList({ chats, selectedChat, onSelectChat, isLoading, searchQuery, setSearchQuery, onOpenCreateModal, mobileView }: any) {
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
              onClick={() => onSelectChat(chat)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                selectedChat?.id === chat.id ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <div className="relative">
                <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white shadow-sm">
                  <AvatarImage src={chat.profileImageUrl || undefined} className="object-cover" />
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
  scrollRef,
  onMediaSelect,
  mediaPreview,
  selectedMedia,
  setSelectedMedia,
  setMediaPreview
}: any) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId"));
    }
  }, []);

  return (
    <div className="bg-white h-full flex flex-col">
      {selectedChat ? (
        <>
          {/* Chat Header */}
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileView("list")}>
                <ChevronLeft size={24} />
              </Button>
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-slate-100">
                  <AvatarImage src={selectedChat.profileImageUrl || undefined} className="object-cover" />
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
            <Button variant="ghost" size="icon" className="text-[#800517] hover:bg-red-50" onClick={() => toast.info("Call clicked")}>
              <Volume2 size={20} />
            </Button>
          </div>

          {/* Messages Area - Scrollable (fixed with min-h-0) */}
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto min-h-0 p-4 bg-[#F7F8FA]"
          >
            {messages.length > 0 ? (
              messages.map((msg: any, idx: number) => (
                <MessageBubble
                  key={msg.id || idx}
                  content={msg.content}
                  senderName={msg.sender?.firstName || msg.authorName || "User"}
                  isMe={userId ? msg.sender?.id === userId : false}
                  timestamp={msg.createdAt}
                  avatarUrl={msg.sender?.avatarUrl || msg.authorAvatar}
                  audioUrl={msg.audioUrl}
                  imageUrl={msg.imageUrl}
                  videoUrl={msg.videoUrl}
                  status={msg.status}
                />
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full">
                <p className="text-sm italic">No messages yet. Start the conversation!</p>
              </div>
            )}

            {isRecording && (
              <div className="flex items-center gap-2 self-end bg-red-50 border border-red-100 p-2 px-4 rounded-full animate-pulse shadow-sm w-fit">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
                <span className="text-xs font-bold text-red-600">Recording... {formatDuration(recordingDuration)}</span>
              </div>
            )}

            {/* Media Preview */}
            {mediaPreview && (
              <div className="flex justify-end mt-2">
                <div className="relative max-w-[200px] rounded-lg overflow-hidden border">
                  {selectedMedia?.type.startsWith('image/') ? (
                    <img src={mediaPreview} alt="Preview" className="w-full h-auto" />
                  ) : (
                    <video src={mediaPreview} className="w-full h-auto" controls />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full h-6 w-6"
                    onClick={() => {
                      setSelectedMedia(null);
                      setMediaPreview(null);
                    }}
                  >
                    <X size={12} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 bg-white">
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
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="ghost"
                        className="flex flex-col h-auto py-4 gap-2 rounded-2xl hover:bg-slate-50"
                        onClick={() => onMediaSelect('image')}
                      >
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                          <ImageIcon size={24} />
                        </div>
                        <span className="text-xs font-bold">Photo</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex flex-col h-auto py-4 gap-2 rounded-2xl hover:bg-slate-50"
                        onClick={() => onMediaSelect('video')}
                      >
                        <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                          <VideoIcon size={24} />
                        </div>
                        <span className="text-xs font-bold">Video</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex flex-col h-auto py-4 gap-2 rounded-2xl hover:bg-slate-50"
                        onClick={() => onMediaSelect('audio')}
                      >
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                          <Music size={24} />
                        </div>
                        <span className="text-xs font-bold">Audio</span>
                      </Button>
                    </div>
                    <div className="space-y-3 pt-2 border-t">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Book size={18} className="text-[#800517]" />
                        Share Scripture
                      </h3>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
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
                  {(message.trim() || audioBlob || selectedMedia) && (
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