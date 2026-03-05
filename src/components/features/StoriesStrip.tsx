"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

const mockStories = [
    { id: 1, name: "Your Story", isUser: true, avatar: "" },
    { id: 2, name: "John Doe", isUser: false, avatar: "", hasUnread: true },
    { id: 3, name: "Sarah Smith", isUser: false, avatar: "", hasUnread: true },
    { id: 4, name: "Christful", isUser: false, avatar: "", hasUnread: false },
    { id: 5, name: "Emmanuel", isUser: false, avatar: "", hasUnread: true },
    { id: 6, name: "Ruth", isUser: false, avatar: "", hasUnread: false },
    { id: 7, name: "David M.", isUser: false, avatar: "", hasUnread: true },
];

export function StoriesStrip() {
    return (
        <div className="w-full bg-white dark:bg-black/80 py-4 border-b border-gray-100 dark:border-gray-800/50 mb-2">
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
                {mockStories.map((story) => (
                    <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
                        <div className={`relative rounded-full p-[2px] transition-all duration-300 transform group-hover:scale-105 ${story.hasUnread ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            <Avatar className="h-16 w-16 border-2 border-white dark:border-black shadow-sm">
                                <AvatarImage src={story.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {story.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            {story.isUser && (
                                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border-2 border-white dark:border-black text-white transform transition-transform duration-300 group-hover:scale-110">
                                    <Plus size={12} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 w-16 truncate text-center transition-colors duration-300 group-hover:text-primary">
                            {story.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
