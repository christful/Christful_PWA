import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date-utils";
import { Check, CheckCheck, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
    content?: string;
    senderName: string;
    isMe: boolean;  // This must be true for your messages
    timestamp: string;
    avatarUrl?: string;
    audioUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    status?: "sent" | "delivered" | "read";
    role?: string;
    onReply?: () => void;
    onReact?: () => void;
    replyTo?: {
        senderName: string;
        content: string;
    };
}

export function MessageBubble({
    content,
    senderName,
    isMe,
    timestamp,
    avatarUrl,
    audioUrl,
    imageUrl,
    videoUrl,
    status,
    role,
    onReply,
    onReact,
    replyTo
}: MessageBubbleProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            const audio = audioRef.current;
            
            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);
                const progress = (audio.currentTime / audio.duration) * 100;
                setAudioProgress(progress);
            };

            const handleLoadedMetadata = () => {
                setAudioDuration(audio.duration);
            };

            const handleEnded = () => {
                setIsPlaying(false);
                setAudioProgress(0);
                setCurrentTime(0);
            };

            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('ended', handleEnded);

            return () => {
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('ended', handleEnded);
            };
        }
    }, []);

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusIcon = () => {
        switch(status) {
            case 'sent':
                return <Check size={14} className="text-gray-400" />;
            case 'delivered':
                return <CheckCheck size={14} className="text-gray-400" />;
            case 'read':
                return <CheckCheck size={14} className="text-blue-500" />;
            default:
                return null;
        }
    };

    return (
        <div
            className={cn(
                "flex w-full mb-3 group",
                isMe ? "justify-end" : "justify-start"
            )}
        >
            <div className={cn(
                "flex gap-2 max-w-[85%] md:max-w-[70%]",
                isMe ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar for non-me messages */}
                {!isMe && (
                    <div className="flex-shrink-0 self-end mb-1">
                        <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-[#800517] to-[#a0061d] text-white text-xs">
                                {senderName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                )}

                <div className="flex flex-col flex-1">
                    {/* Sender name for non-me messages */}
                    {!isMe && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                            <span className="text-xs font-semibold text-gray-700">
                                {senderName}
                            </span>
                            {role && (
                                <span className="bg-[#800517]/10 text-[#800517] text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {role}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Reply indicator */}
                    {replyTo && (
                        <div 
                            className={cn(
                                "mb-1 p-2 rounded-lg bg-gray-50 border-l-2 border-[#800517] text-xs max-w-[250px]",
                                isMe ? "ml-auto" : "mr-auto"
                            )}
                        >
                            <p className="font-medium text-[#800517] mb-0.5">
                                Replying to {replyTo.senderName}
                            </p>
                            <p className="text-gray-500 truncate">{replyTo.content}</p>
                        </div>
                    )}

                    {/* Message bubble */}
                    <div className="relative">
                        <div
                            className={cn(
                                "relative px-4 py-2.5 shadow-sm text-[15px] leading-relaxed break-words",
                                isMe
                                    ? "bg-[#800517]/5 text-gray-900 rounded-2xl rounded-br-none border border-[#800517]/10"
                                    : "bg-white text-gray-900 rounded-2xl rounded-bl-none border border-gray-100"
                            )}
                        >
                            {/* Image content */}
                            {imageUrl && (
                                <div className="mb-2 rounded-lg overflow-hidden max-w-[250px]">
                                    <img 
                                        src={imageUrl} 
                                        alt="Shared image" 
                                        className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                    />
                                </div>
                            )}

                            {/* Video content */}
                            {videoUrl && (
                                <div className="mb-2 rounded-lg overflow-hidden max-w-[250px]">
                                    <video 
                                        src={videoUrl} 
                                        controls 
                                        className="w-full h-auto"
                                    />
                                </div>
                            )}

                            {/* Audio content */}
                            {audioUrl && (
                                <div className={cn(
                                    "mb-2 p-3 rounded-xl max-w-[250px]",
                                    isMe ? "bg-[#800517]/10" : "bg-gray-50"
                                )}>
                                    <audio ref={audioRef} src={audioUrl} className="hidden" />
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 rounded-full",
                                                isMe 
                                                    ? "hover:bg-[#800517]/20 text-[#800517]" 
                                                    : "hover:bg-gray-200 text-gray-700"
                                            )}
                                            onClick={toggleAudio}
                                        >
                                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                        </Button>
                                        <div className="flex-1">
                                            <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full transition-all duration-100",
                                                        "bg-[#800517]"
                                                    )}
                                                    style={{ width: `${audioProgress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-[10px] text-gray-500">
                                                    {formatTime(currentTime)}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {formatTime(audioDuration)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Text content */}
                            {content && (
                                <p className={cn(
                                    "whitespace-pre-wrap",
                                    imageUrl || videoUrl || audioUrl ? "mt-2" : ""
                                )}>
                                    {content}
                                </p>
                            )}

                            {/* Message actions (on hover) */}
                            <div className={cn(
                                "absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                                isMe ? "left-0" : "right-0"
                            )}>
                                <div className="flex items-center gap-1 bg-white rounded-full shadow-lg border p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-gray-100"
                                        onClick={onReact}
                                    >
                                        <span className="text-sm">😊</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-gray-100"
                                        onClick={onReply}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                        </svg>
                                    </Button>
                                </div>
                            </div>

                            {/* Timestamp and status */}
                            <div className={cn(
                                "flex items-center gap-1 mt-1",
                                isMe ? "justify-end" : "justify-start"
                            )}>
                                <span className={cn(
                                    "text-[10px]",
                                    isMe ? "text-gray-500" : "text-gray-400"
                                )}>
                                    {formatRelativeTime(timestamp)}
                                </span>
                                {isMe && (
                                    <span className="text-gray-500">
                                        {getStatusIcon()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Message tail for non-me messages */}
                        {!isMe && (
                            <div className="absolute left-0 bottom-0 w-4 h-4 bg-white border-l border-b border-gray-100 transform -translate-x-2 translate-y-1 rotate-45 rounded-bl-lg" />
                        )}
                        
                        {/* Message tail for me messages - faint red */}
                        {isMe && (
                            <div className="absolute right-0 bottom-0 w-4 h-4 bg-[#800517]/5 border-r border-b border-[#800517]/10 transform translate-x-2 translate-y-1 rotate-45 rounded-br-lg" />
                        )}
                    </div>
                </div>

                {/* Spacer for avatar alignment when isMe is true */}
                {isMe && <div className="w-8 flex-shrink-0" />}
            </div>
        </div>
    );
}