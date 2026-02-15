"use client";

import { Button } from "@/components/ui/button";
import { Users, Plus, Sparkles, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Community } from "@/app/communities/types";

interface DiscoveryCenterProps {
    selectedCommunity: Community | null;
    showMobileSidebar: boolean;
}

export function DiscoveryCenter({
    selectedCommunity,
    showMobileSidebar,
}: DiscoveryCenterProps) {
    return (
        <div className={cn(
            "w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[70vh] px-4 relative",
            "md:block",
            !selectedCommunity || showMobileSidebar ? "block" : "hidden md:block"
        )}>
            {/* Brick Red Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#800517]/5 blur-3xl"></div>
                <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-[#800517]/10 blur-xl"></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full bg-[#800517]/10 blur-xl"></div>

                <svg className="absolute top-0 left-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#800517" strokeWidth="1" strokeOpacity="0.3" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                <div className="absolute bottom-10 right-10 opacity-10">
                    <div className="grid grid-cols-3 gap-3">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-[#800517]" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-6">
                <div className="inline-flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#800517]/20 rounded-full blur-xl"></div>
                        <div className="relative w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center">
                            <Users className="w-10 h-10 text-[#800517]" />
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                    Find Your <span className="text-[#800517]">Community</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 max-w-lg mx-auto">
                    Create a space for your community to grow, share, and connect with like-minded people.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/communities/create">
                        <Button className="bg-[#800517] hover:bg-[#600412] text-white font-medium px-8 py-6 rounded-full text-base md:text-lg shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto">
                            <Plus className="mr-2 h-5 w-5" />
                            Create a Community
                        </Button>
                    </Link>

                    <Button variant="outline" className="border-[#800517] text-[#800517] hover:bg-[#800517]/5 px-8 py-6 rounded-full text-base md:text-lg w-full sm:w-auto">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Explore
                    </Button>
                </div>

                <div className="pt-8 flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-[#800517]/60" />
                        <span>1.2k+ communities</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#800517]/60" />
                        <span>50k+ members</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
