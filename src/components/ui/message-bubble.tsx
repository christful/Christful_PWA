import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
    content: string;
    senderName: string;
    isMe: boolean;
    timestamp: string;
    avatarUrl?: string; // Only needed for receiver
    status?: "sent" | "delivered" | "read"; // For sender
}

export function MessageBubble({
    content,
    senderName,
    isMe,
    timestamp,
    avatarUrl,
    status, // Not fully implemented yet visually but good for interface
}: MessageBubbleProps) {
    return (
        <div
            className={cn(
                "flex gap-2 max-w-[85%] md:max-w-[70%] mb-2",
                isMe ? "self-end flex-row-reverse" : "self-start"
            )}
        >
            {!isMe && (
                <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-slate-200 text-slate-500 text-xs">
                        {senderName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            )}

            <div
                className={cn(
                    "relative px-3 py-2 shadow-sm text-[15px] leading-relaxed break-words",
                    isMe
                        ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none rounded-2xl"
                        : "bg-white text-gray-900 rounded-tl-none rounded-2xl"
                )}
                style={{
                    // Optional: Add subtle "tail" using SVG or clip-path if we want to get fancy later
                    // For now the border-radius trick works well enough for 90% accuracy
                }}
            >
                {!isMe && (
                    <p className="text-xs font-bold text-[#e542a3] mb-1">
                        {senderName}
                    </p>
                )}

                <div className="mr-8">
                    {/* mr-8 to reserve space for timestamp inside the bubble */}
                    {content}
                </div>

                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[11px] text-gray-500">
                        {timestamp}
                    </span>
                    {isMe && (
                        // Double check icon (simplified)
                        <svg viewBox="0 0 16 15" width="16" height="15" className={cn("inline-block w-4 h-4", status === 'read' ? "text-[#53bdeb]" : "text-gray-400")}>
                            <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.473-.018l6.897-7.559a.439.439 0 0 0-.178-.616z" />
                            <path fill="currentColor" d="M10.616 11.411a.419.419 0 0 1-.037.54l-1.321 1.267a.324.324 0 0 1-.474-.018l-6.896-7.56a.439.439 0 0 1 .176-.615l.478-.371a.365.365 0 0 1 .511-.064l5.357 5.877a.32.32 0 0 0 .484-.033l.23-.21a.379.379 0 0 1 .094-.065.405.405 0 0 0 .094.065l1.378 1.189z" />
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
}
