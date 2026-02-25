"use client";

import { Button } from "@/components/ui/button";
import { Users, Plus, Sparkles, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Community } from "@/app/communities/types";

import { useRouter, useParams } from "next/navigation";

interface DiscoveryCenterProps {
    showMobileSidebar: boolean;
}

export function DiscoveryCenter({
    showMobileSidebar,
}: DiscoveryCenterProps) {
    const params = useParams();
    const selectedId = params.id as string;

    const suggestedGroups = [
        { id: 1, name: "Christian Entrepreneurs", members: "125K", type: "Public Group", cover: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop" },
        { id: 2, name: "Daily Devotionals", members: "45K", type: "Private Group", cover: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=500&h=300&fit=crop" },
        { id: 3, name: "Worship Musicians", members: "8.2K", type: "Public Group", cover: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500&h=300&fit=crop" },
        { id: 4, name: "Youth Ministry Leaders", members: "12K", type: "Private Group", cover: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&h=300&fit=crop" },
        { id: 5, name: "Christian Singles", members: "85K", type: "Private Group", cover: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&h=300&fit=crop" },
        { id: 6, name: "Bible Study Fellowship", members: "210K", type: "Public Group", cover: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=500&h=300&fit=crop" }
    ];

    return (
        <div className={cn(
            "w-full mx-auto md:pb-0 bg-[#F0F2F5] min-h-screen",
            "md:block",
            !selectedId || showMobileSidebar ? "block" : "hidden md:block"
        )}>
            {/* Hero Section */}
            <div className="bg-white px-4 py-6 md:px-8 md:py-8 shadow-sm border-b">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <span>Discover Communities</span>
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm md:text-base max-w-xl">
                            Find groups that share your interests. From local ministries to global prayer networks, connect with believers worldwide.
                        </p>
                    </div>
                    <Link href="/communities/create shrink-0">
                        <Button className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-900 font-bold px-6 py-2.5 rounded-lg transition-colors duration-200 active:scale-95 shadow-none w-full md:w-auto flex items-center gap-2">
                            <Plus size={18} />
                            Create New Group
                        </Button>
                    </Link>
                </div>

                {/* Categories */}
                <div className="max-w-5xl mx-auto mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['For You', 'Local', 'Prayer', 'Study', 'Youth', 'Music', 'Tech', 'Networking'].map((cat, i) => (
                        <button key={cat} className={cn(
                            "px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors duration-200 active:scale-95",
                            i === 0 ? "bg-[#800517]/10 text-[#800517]" : "bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-700"
                        )}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">

                {/* Section: Suggested for you */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900">Suggested for you</h2>
                        <button className="text-[#800517] text-sm font-semibold hover:bg-[#800517]/5 px-3 py-1.5 rounded-md transition-colors">See All</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Create Group Card */}
                        <div className="bg-[#f0f2f5] rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md items-center justify-center min-h-[250px] md:min-h-[280px]">
                            <div className="h-16 w-16 bg-[#800517]/10 rounded-full flex items-center justify-center mb-4 cursor-pointer hover:scale-110 transition-transform duration-300">
                                <Plus size={32} className="text-[#800517]" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">Create Group</h3>
                            <p className="text-sm text-slate-500 mt-1 text-center px-4">Build a community around your interests</p>
                            <Link href="/communities/create" className="mt-6 w-full px-6">
                                <Button className="w-full bg-[#800517] hover:bg-[#600412] text-white font-bold transition-all duration-300 active:scale-95 py-5 rounded-lg">
                                    Get Started
                                </Button>
                            </Link>
                        </div>

                        {suggestedGroups.map(group => (
                            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md cursor-pointer group">
                                <div className="h-32 md:h-40 w-full relative overflow-hidden">
                                    <img src={group.cover} alt={group.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="font-bold text-slate-900 line-clamp-1 text-base md:text-lg">{group.name}</h3>
                                    <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">{group.members} members • {group.type}</p>

                                    {/* Member Avatars Overlap */}
                                    <div className="flex -space-x-2 mt-3 mb-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                                                <Users size={12} className="text-slate-400" />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-2">
                                        <Button className="w-full bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-900 font-bold transition-all duration-300 active:scale-95 py-5 rounded-lg">
                                            Join Group
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Popular near you */}
                <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900">Popular near you</h2>
                        <button className="text-[#800517] text-sm font-semibold hover:bg-[#800517]/5 px-3 py-1.5 rounded-md transition-colors">See All</button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6 text-center text-slate-500">
                        <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <p className="font-semibold text-slate-700">Turn on location</p>
                        <p className="text-sm mt-1">Discover groups in your local church community.</p>
                        <Button className="mt-4 bg-primary text-white font-bold rounded-lg transition-all active:scale-95">Enable Location</Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
