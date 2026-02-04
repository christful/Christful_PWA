"use client";

import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Share2, Music2 } from "lucide-react";
import { useState } from "react";

const DUMMY_VIDEOS = [
    {
        id: "1",
        author: "Pastor Chris",
        description: "The Power of Faith: Understanding how to walk in the Spirit and overcome life's challenges. #Faith #Gospel #ChristianLife",
        likes: "12.5k",
        comments: "842",
        shares: "1.2k",
        audio: "Original Audio - Pastor Chris",
        color: "bg-slate-900"
    },
    {
        id: "2",
        author: "Worship Together",
        description: "Morning Devotion: A beautiful time of worship and praise. Join us as we lift up the name of Jesus! 🙌✨ #Worship #MorningPrayer",
        likes: "15.2k",
        comments: "1.1k",
        shares: "2.5k",
        audio: "Way Maker - Sinach",
        color: "bg-indigo-900"
    },
    {
        id: "3",
        author: "Bible Study Notes",
        description: "Quick Bible Study: Romans 8:28 - And we know that all things work together for good to them that love God... #BibleStudy #Encouragement",
        likes: "8.9k",
        comments: "450",
        shares: "900",
        audio: "Peaceful Piano - Bible Study",
        color: "bg-emerald-900"
    }
];

export default function VideoPage() {
    const [activeVideo, setActiveVideo] = useState(0);

    return (
        <div className="min-h-screen bg-black">
            <Header />

            <main className="h-screen pt-16 pb-20 md:pb-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
                <div className="max-w-md mx-auto h-full">
                    {DUMMY_VIDEOS.map((video, index) => (
                        <div
                            key={video.id}
                            className={`h-[calc(100vh-4rem)] w-full snap-start relative ${video.color} flex flex-col justify-center items-center text-white`}
                        >
                            <div className="flex flex-col items-center">
                                <VideoPlaceholderIcon />
                                <p className="mt-4 text-white/50 animate-pulse">Sermon Video Loading...</p>
                            </div>

                            {/* Sidebar Actions */}
                            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden mb-1">
                                        <Avatar className="h-full w-full">
                                            <AvatarFallback className="bg-primary text-white">
                                                {video.author.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="bg-primary rounded-full p-1 -mt-3 z-10">
                                        <PlusIconSmall />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <Heart className="h-8 w-8 hover:fill-red-500 transition-colors cursor-pointer" />
                                    <span className="text-xs font-semibold">{video.likes}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <MessageCircle className="h-8 w-8 cursor-pointer" />
                                    <span className="text-xs font-semibold">{video.comments}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <Share2 className="h-8 w-8 cursor-pointer" />
                                    <span className="text-xs font-semibold">{video.shares}</span>
                                </div>

                                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center animate-spin-slow">
                                    <Music2 className="h-5 w-5" />
                                </div>
                            </div>

                            {/* Bottom Info */}
                            <div className="absolute left-4 bottom-20 right-16">
                                <h3 className="font-bold text-lg mb-2">{video.author}</h3>
                                <p className="text-sm line-clamp-3 mb-3 text-white/90">
                                    {video.description}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Music2 className="h-4 w-4" />
                                    <div className="overflow-hidden whitespace-nowrap w-40">
                                        <p className="text-sm animate-marquee inline-block">{video.audio}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <BottomNav />

            <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

function VideoPlaceholderIcon() {
    return (
        <svg className="w-20 h-20 text-white/20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 15.065V8.935a.5.5 0 01.757-.429l5.441 3.065a.5.5 0 010 .858l-5.441 3.065a.5.5 0 01-.757-.429zM12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1z" />
        </svg>
    );
}

function PlusIconSmall() {
    return (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
    );
}
