"use client";

import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    MessageCircle, Heart, Share2, Music2, Plus,
    Bookmark, MoreHorizontal, Clapperboard, Users
} from "lucide-react";
import { useState } from "react";

const DUMMY_REELS = [
    {
        id: "1",
        author: "Pastor Chris",
        description: "The Power of Faith: Understanding how to walk in the Spirit and overcome life's challenges. #Faith #Gospel #ChristianLife",
        likes: "12.5k",
        comments: "842",
        shares: "1.2k",
        audio: "Original Audio - Pastor Chris",
        bg: "from-slate-900 to-slate-800"
    },
    {
        id: "2",
        author: "Worship Together",
        description: "Morning Devotion: A beautiful time of worship and praise. Join us as we lift up the name of Jesus! 🙌✨ #Worship #MorningPrayer",
        likes: "15.2k",
        comments: "1.1k",
        shares: "2.5k",
        audio: "Way Maker - Sinach",
        bg: "from-indigo-900 to-indigo-800"
    },
    {
        id: "3",
        author: "Bible Study Notes",
        description: "Quick Bible Study: Romans 8:28 - And we know that all things work together for good to them that love God... #BibleStudy #Encouragement",
        likes: "8.9k",
        comments: "450",
        shares: "900",
        audio: "Peaceful Piano - Bible Study",
        bg: "from-emerald-900 to-emerald-800"
    }
];

export default function VideoPage() {
    const LeftSidebar = () => (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <nav className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-3 bg-slate-50 text-[#800517]">
                        <Clapperboard size={20} />
                        <span className="font-bold text-sm">For You</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-50">
                        <Users size={20} />
                        <span className="font-bold text-sm">Following</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-50">
                        <Bookmark size={20} />
                        <span className="font-bold text-sm">Saved</span>
                    </Button>
                </nav>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-xs font-bold text-slate-400 mb-4 px-2 uppercase">Popular Creators</h3>
                <div className="space-y-4">
                    {["John Doe", "Sarah Church", "Prayer Group"].map((name, i) => (
                        <div key={i} className="flex items-center gap-3 px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-[10px]">{name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-700">{name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const ReelsFeed = () => (
        <div className="h-[calc(100vh-8rem)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide rounded-2xl bg-black shadow-2xl relative">
            {DUMMY_REELS.map((reel) => (
                <div
                    key={reel.id}
                    className={`h-full w-full snap-start relative bg-gradient-to-b ${reel.bg} flex flex-col justify-center items-center text-white`}
                >
                    <div className="flex flex-col items-center opacity-40">
                        <VideoPlaceholderIcon />
                        <p className="mt-4 text-xs tracking-widest uppercase">Video Stream</p>
                    </div>

                    {/* Right Actions Overlay */}
                    <div className="absolute right-4 bottom-12 flex flex-col gap-5 items-center">
                        <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden shadow-lg relative">
                                <Avatar className="h-full w-full">
                                    <AvatarFallback className="bg-primary text-white">
                                        {reel.author.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="bg-[#800517] rounded-full p-1 -mt-3 z-10 shadow-md">
                                <Plus size={12} className="text-white fill-white" />
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-white/10 text-white">
                                <Heart className="h-7 w-7" />
                            </Button>
                            <span className="text-[10px] font-bold">{reel.likes}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-white/10 text-white">
                                <MessageCircle className="h-7 w-7" />
                            </Button>
                            <span className="text-[10px] font-bold">{reel.comments}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-white/10 text-white">
                                <Share2 className="h-7 w-7" />
                            </Button>
                            <span className="text-[10px] font-bold">{reel.shares}</span>
                        </div>

                        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-white/10 text-white">
                            <MoreHorizontal className="h-6 w-6" />
                        </Button>

                        <div className="h-10 w-10 rounded-full bg-slate-800/80 border border-white/20 flex items-center justify-center animate-spin-slow">
                            <Music2 className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Bottom Info Overlay */}
                    <div className="absolute left-6 bottom-8 right-20">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-bold text-lg hover:underline cursor-pointer">{reel.author}</h3>
                            <Button size="sm" className="h-7 bg-white/20 hover:bg-white/30 text-white border border-white/20 text-xs rounded-full px-4">
                                Follow
                            </Button>
                        </div>
                        <p className="text-sm line-clamp-2 mb-4 text-white/90 leading-relaxed max-w-sm">
                            {reel.description}
                        </p>
                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm w-fit p-1.5 px-3 rounded-full border border-white/10">
                            <Music2 className="h-3 w-3" />
                            <div className="overflow-hidden whitespace-nowrap w-24">
                                <p className="text-[11px] font-medium animate-marquee inline-block">{reel.audio}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const Suggestions = () => (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clapperboard size={18} className="text-[#800517]" />
                    Suggested Reels
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[9/16] bg-slate-100 rounded-lg relative overflow-hidden group cursor-pointer shadow-sm border">
                            <img
                                src={`https://images.unsplash.com/photo-${1500000000000 + i * 1000}?w=200&h=350&fit=crop`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
                                <p className="text-[10px] text-white font-bold line-clamp-1">Spiritual Growth v{i}</p>
                                <div className="flex items-center gap-1 text-[8px] text-white/80">
                                    <Clapperboard size={8} />
                                    <span>{i}.{i}k views</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="secondary" className="w-full mt-4 text-xs font-bold py-5">See More Reels</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F2F5]">
            <Header />
            <PageGrid
                left={<LeftSidebar />}
                center={<ReelsFeed />}
                right={<Suggestions />}
            />
            <BottomNav />

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee { animation: marquee 10s linear infinite; }
                .animate-spin-slow { animation: spin 4s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

function VideoPlaceholderIcon() {
    return (
        <svg className="w-24 h-24 text-white/10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 15.065V8.935a.5.5 0 01.757-.429l5.441 3.065a.5.5 0 010 .858l-5.441 3.065a.5.5 0 01-.757-.429zM12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1z" />
        </svg>
    );
}
