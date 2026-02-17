"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Community } from "@/app/communities/types";

interface CommunityListSidebarProps {
    selectedCommunity: Community | null;
    showMobileSidebar: boolean;
    handleBackToDiscovery: () => void;
    isLoadingUserCommunities: boolean;
    userCommunities: Community[];
    checkIsMember: (community: Community) => boolean;
    getUserRole: (community: Community) => string | null;
    handleCommunityClick: (community: Community) => void;
    suggestedCommunities: any[];
    handleJoinCommunity: (communityId: string) => void;
}

export function CommunityListSidebar({
    selectedCommunity,
    showMobileSidebar,
    handleBackToDiscovery,
    isLoadingUserCommunities,
    userCommunities,
    checkIsMember,
    getUserRole,
    handleCommunityClick,
    suggestedCommunities,
    handleJoinCommunity,
}: CommunityListSidebarProps) {
    return (
        <div className={cn(
            "bg-white md:rounded-xl shadow-sm border h-full flex flex-col overflow-hidden border-x-0 md:border-x",
            "md:block",
            selectedCommunity && !showMobileSidebar ? "hidden md:block" : "block"
        )}>
            <div className="p-5 border-b">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">Communities</h2>
                    <Link href="/communities/create">
                        <Button variant="ghost" size="icon" className="bg-slate-100 rounded-full hover:bg-[#800517] hover:text-white transition-all">
                            <Plus size={20} />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {/* Navigation Links */}
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-12 rounded-lg",
                            !selectedCommunity && "bg-slate-100 text-[#800517]"
                        )}
                        onClick={handleBackToDiscovery}
                    >
                        <div className={cn(
                            "p-2 rounded-lg",
                            !selectedCommunity ? "bg-[#800517] text-white" : "bg-slate-100 text-slate-600"
                        )}>
                            <Globe size={18} />
                        </div>
                        <span className="font-semibold">Discover</span>
                    </Button>
                </div>

                {/* Your Communities */}
                <div className="mt-6">
                    <h3 className="px-3 text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                        Your Communities
                    </h3>
                    {isLoadingUserCommunities ? (
                        <div className="py-4 flex justify-center">
                            <div className="animate-spin h-5 w-5 border-2 border-[#800517] border-t-transparent rounded-full"></div>
                        </div>
                    ) : userCommunities.length > 0 ? (
                        userCommunities.map((community) => {
                            const userRole = getUserRole(community);

                            return (
                                <div
                                    key={community.id}
                                    onClick={() => handleCommunityClick(community)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors group",
                                        selectedCommunity?.id === community.id
                                            ? "bg-[#800517]/10 border-l-4 border-[#800517]"
                                            : "hover:bg-slate-50"
                                    )}
                                >
                                    <Avatar className="h-10 w-10 rounded-lg border">
                                        <AvatarImage src={community.avatarUrl || undefined} className="object-cover" />
                                        <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                                            {community.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-medium block truncate",
                                                selectedCommunity?.id === community.id ? "text-[#800517]" : "text-slate-700 group-hover:text-[#800517]"
                                            )}>
                                                {community.name}
                                            </span>
                                            {userRole === 'admin' && (
                                                <Shield className="h-3 w-3 text-[#800517]" />
                                            )}
                                        </div>
                                        
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-slate-500 px-3 py-2">
                            You haven't joined any communities yet
                        </p>
                    )}
                </div>

                {/* Suggested Communities */}
                <div className="mt-6">
                    <h3 className="px-3 text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                        Suggested For You
                    </h3>
                    <div className="space-y-2">
                        {suggestedCommunities.map((comm) => (
                            <div key={comm.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                <Avatar className="h-10 w-10 rounded-lg border">
                                    <AvatarImage src={comm.avatarUrl} className="object-cover" />
                                    <AvatarFallback className="bg-slate-100 text-slate-600">
                                        {comm.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{comm.name}</p>
                                    <p className="text-xs text-slate-500">{comm.members} members</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-[#800517] text-[#800517] hover:bg-[#800517] hover:text-white rounded-full px-4"
                                    onClick={() => handleJoinCommunity(comm.id)}
                                >
                                    Join
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
