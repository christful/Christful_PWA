"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    ChevronLeft, Volume2, Plus, ImageIcon, Video as VideoIcon, Music, Book, Smile, Mic, Send, Trash2, X, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

const EMOJIS = ["🙏", "🙌", "✨", "❤️", "😊", "😂", "🔥", "🤝", "📖", "⛪", "🕊️", "😇", "💡", "💪", "🌈", "🎵", "✍️"];

const BIBLE_VERSES = [
    { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son..." },
    { ref: "Psalm 23:1", text: "The LORD is my shepherd; I shall not want." },
    { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
    { ref: "Proverbs 3:5", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
    { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God..." },
    { ref: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
];

export function ActiveChat({
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
    scrollRef,
    selectedMedia,
    setSelectedMedia,
    mediaPreview,
    setMediaPreview,
    mediaType,
    setMediaType,
}: any) {
    const router = useRouter();
    const params = useParams();
    const selectedId = params.id as string;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const captionInputRef = useRef<HTMLInputElement>(null);

    const [modalCaption, setModalCaption] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUserId(localStorage.getItem("userId"));
        }
    }, []);

    // Auto-focus caption input when modal opens
    useEffect(() => {
        if (selectedMedia && captionInputRef.current) {
            captionInputRef.current.focus();
        }
    }, [selectedMedia]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = type === 'image' ? 10 * 1024 * 1024 : type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
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
            setMediaPreview(null);
            toast.info(`Selected audio: ${file.name}`);
        }

        e.target.value = '';
    };

    const triggerFileInput = (type: 'image' | 'video' | 'audio') => {
        if (type === 'image') fileInputRef.current?.click();
        else if (type === 'video') videoInputRef.current?.click();
        else audioInputRef.current?.click();
    };

    const clearSelectedMedia = () => {
        setSelectedMedia(null);
        setMediaPreview(null);
        setMediaType(null);
        setModalCaption("");
    };

    const handleSendFromModal = () => {
        if (selectedMedia) {
            onSendMessage(modalCaption, undefined, { file: selectedMedia, type: mediaType });
            clearSelectedMedia();
        }
    };

    return (
        <div className="bg-white h-full flex flex-col">
            {/* Hidden file inputs */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'image')}
            />
            <input
                type="file"
                ref={videoInputRef}
                className="hidden"
                accept="video/*"
                onChange={(e) => handleFileSelect(e, 'video')}
            />
            <input
                type="file"
                ref={audioInputRef}
                className="hidden"
                accept="audio/*"
                onChange={(e) => handleFileSelect(e, 'audio')}
            />

            {selectedChat ? (
                <>
                    {/* Chat Header */}
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push("/messages")}>
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

                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto min-h-0 p-4 bg-[#F7F8FA] flex flex-col gap-4 scroll-smooth"
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
                                                onClick={() => triggerFileInput('image')}
                                            >
                                                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                                    <ImageIcon size={24} />
                                                </div>
                                                <span className="text-xs font-bold">Photo</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="flex flex-col h-auto py-4 gap-2 rounded-2xl hover:bg-slate-50"
                                                onClick={() => triggerFileInput('video')}
                                            >
                                                <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                                                    <VideoIcon size={24} />
                                                </div>
                                                <span className="text-xs font-bold">Video</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="flex flex-col h-auto py-4 gap-2 rounded-2xl hover:bg-slate-50"
                                                onClick={() => triggerFileInput('audio')}
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
                                    onKeyPress={(e) => e.key === "Enter" && (message.trim() || audioBlob || selectedMedia) && onSendMessage(message, audioBlob || undefined, selectedMedia ? { file: selectedMedia, type: mediaType } : undefined)}
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
                                            onClick={() => onSendMessage(message, audioBlob || undefined, selectedMedia ? { file: selectedMedia, type: mediaType } : undefined)}
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

            {/* Full-screen media preview modal */}
            {selectedMedia && mediaType !== 'audio' && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={clearSelectedMedia}>
                    <div className="relative max-w-3xl w-full max-h-[90vh] bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Media display */}
                        <div className="flex items-center justify-center h-full max-h-[70vh]">
                            {mediaType === 'image' ? (
                                <img src={mediaPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                            ) : mediaType === 'video' ? (
                                <video src={mediaPreview} className="max-w-full max-h-full" controls autoPlay />
                            ) : null}
                        </div>
                        {/* Bottom bar with caption and send */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex items-center gap-2">
                                <Input
                                    ref={captionInputRef}
                                    placeholder="Add a caption..."
                                    value={modalCaption}
                                    onChange={(e) => setModalCaption(e.target.value)}
                                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendFromModal()}
                                />
                                <Button
                                    size="icon"
                                    className="bg-[#800517] hover:bg-[#A0061D] rounded-full shrink-0"
                                    onClick={handleSendFromModal}
                                >
                                    <Send size={18} />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-white hover:bg-white/20 rounded-full"
                                    onClick={clearSelectedMedia}
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio files don't need a full-screen preview; we keep the existing toast */}
        </div>
    );
}