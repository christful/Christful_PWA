import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatListItemProps {
    id: string;
    name: string;
    avatarUrl?: string;
    lastMessage?: string;
    time?: string;
    unreadCount?: number;
    isActive?: boolean;
    onClick?: () => void;
    type?: "community" | "group"; // flexible for both
}

export function ChatListItem({
    name,
    avatarUrl,
    lastMessage,
    time,
    unreadCount,
    isActive,
    onClick,
}: ChatListItemProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100",
                isActive && "bg-slate-100"
            )}
        >
            <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                <AvatarFallback className="bg-slate-200 text-slate-500 font-medium text-lg">
                    {name.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-slate-900 truncate text-[17px]">
                        {name}
                    </h3>
                    {time && (
                        <span
                            className={cn(
                                "text-xs font-medium whitespace-nowrap ml-2",
                                unreadCount ? "text-[#25D366]" : "text-slate-400"
                            )}
                        >
                            {time}
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center gap-2">
                    <p className="text-slate-500 text-sm truncate leading-5 flex-1">
                        {lastMessage}
                    </p>
                    {unreadCount ? (
                        <span className="flex items-center justify-center bg-[#25D366] text-white text-[10px] font-bold h-5 min-w-[1.25rem] px-1 rounded-full">
                            {unreadCount}
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
