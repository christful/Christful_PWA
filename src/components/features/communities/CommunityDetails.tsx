"use client";

import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, Users, Grid, Calendar, UserPlus,
    Settings, Flag, Shield, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date-utils";
import { Community } from "@/app/communities/types";

interface CommunityDetailsProps {
    selectedCommunity: Community | null;
    showMobileSidebar: boolean;
    handleBackToDiscovery: () => void;
    isLoadingCommunityDetails: boolean;
    handleJoinCommunity: (communityId: string) => void;
    currentUserId: string | null;
    checkIsMember: (community: Community) => boolean;
    getUserRole: (community: Community | null) => string | null;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function CommunityDetails({
    selectedCommunity,
    showMobileSidebar,
    handleBackToDiscovery,
    isLoadingCommunityDetails,
    handleJoinCommunity,
    currentUserId,
    checkIsMember,
    getUserRole,
    activeTab,
    setActiveTab,
}: CommunityDetailsProps) {
    if (!selectedCommunity) return null;

    const isMember = checkIsMember(selectedCommunity);
    const userRole = getUserRole(selectedCommunity);
    const creatorName = selectedCommunity.creator
        ? `${selectedCommunity.creator.firstName} ${selectedCommunity.creator.lastName}`
        : 'Unknown';

    // Show loading state while fetching details
    if (isLoadingCommunityDetails) {
        return (
            <div className="w-full max-w-4xl mx-auto flex items-center justify-center min-h-[70vh]">
                <div className="animate-spin h-8 w-8 border-2 border-[#800517] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className={cn(
            "w-full max-w-4xl mx-auto",
            "block",
            selectedCommunity && !showMobileSidebar ? "block" : "hidden md:block"
        )}>
            {/* Mobile Header with Back Button */}
            <div className="md:hidden flex items-center gap-3 p-4 border-b bg-white">
                <button
                    onClick={handleBackToDiscovery}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-700" />
                </button>
                <h2 className="font-semibold text-lg truncate">{selectedCommunity.name}</h2>
            </div>

            {/* Cover Image */}
            <div className="relative h-48 md:h-64 rounded-t-2xl overflow-hidden bg-gradient-to-br from-[#800517]/20 to-[#600412]/20">
                {selectedCommunity.coverImageUrl ? (
                    <Image
                        src={selectedCommunity.coverImageUrl}
                        alt={selectedCommunity.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#800517]/10 to-[#600412]/10">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    </div>
                )}

                {/* Desktop Back Button */}
                <button
                    onClick={handleBackToDiscovery}
                    className="hidden md:block absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-700" />
                </button>

                {/* Community Avatar */}
                <div className="absolute -bottom-12 left-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24 rounded-2xl border-4 border-white shadow-xl">
                            <AvatarImage src={selectedCommunity.profileImageUrl || undefined} className="object-cover" />
                            <AvatarFallback className="bg-[#800517] text-white text-3xl">
                                {selectedCommunity.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {userRole === 'admin' && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full">
                                <Shield className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Community Info */}
            <div className="mt-16 px-4 md:px-6 pb-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{selectedCommunity.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 text-xs md:text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {selectedCommunity.memberships?.length || 0} members
                            </span>
                            <span className="flex items-center gap-1">
                                <Grid className="h-4 w-4" />
                                {selectedCommunity.groups?.length || 0} groups
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Created {formatRelativeTime(selectedCommunity.createdAt)}
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                            Created by {creatorName}
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {!isMember && (
                            <Button
                                className="bg-[#800517] hover:bg-[#600412] text-white flex-1 md:flex-none"
                                onClick={() => handleJoinCommunity(selectedCommunity.id)}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Join Community
                            </Button>
                        )}
                        {isMember && userRole === 'admin' && (
                            <Button variant="outline" className="border-slate-300 flex-1 md:flex-none">
                                <Settings className="h-4 w-4 mr-2" />
                                Manage
                            </Button>
                        )}
                        {isMember && userRole !== 'admin' && (
                            <Button variant="outline" className="border-slate-300 flex-1 md:flex-none">
                                <Flag className="h-4 w-4 mr-2" />
                                Report
                            </Button>
                        )}
                        {!isMember && (
                            <Button variant="outline" className="border-slate-300 flex-1 md:flex-none">
                                <Flag className="h-4 w-4 mr-2" />
                                Report
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
                        <TabsTrigger
                            value="about"
                            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#800517] data-[state=active]:text-[#800517] px-4 py-2 text-sm"
                        >
                            About
                        </TabsTrigger>
                        <TabsTrigger
                            value="groups"
                            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#800517] data-[state=active]:text-[#800517] px-4 py-2 text-sm"
                        >
                            Groups ({selectedCommunity.groups?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger
                            value="members"
                            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#800517] data-[state=active]:text-[#800517] px-4 py-2 text-sm"
                        >
                            Members ({selectedCommunity.memberships?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="about" className="mt-6">
                        <div className="bg-white rounded-xl border p-4 md:p-6">
                            <h3 className="font-semibold text-lg mb-3">Description</h3>
                            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                                {selectedCommunity.description || "No description provided."}
                            </p>

                            <div className="mt-6 pt-6 border-t">
                                <h3 className="font-semibold text-lg mb-3">Community Details</h3>
                                <dl className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm text-slate-500">Privacy</dt>
                                        <dd className="font-medium">{selectedCommunity.isPrivate ? 'Private' : 'Public'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-slate-500">Created</dt>
                                        <dd className="font-medium">{new Date(selectedCommunity.createdAt).toLocaleDateString()}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-slate-500">Members</dt>
                                        <dd className="font-medium">{selectedCommunity.memberships?.length || 0}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-slate-500">Groups</dt>
                                        <dd className="font-medium">{selectedCommunity.groups?.length || 0}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="groups" className="mt-6">
                        {selectedCommunity.groups && selectedCommunity.groups.length > 0 ? (
                            <div className="">
                                {selectedCommunity.groups.map((group) => (
                                    <div key={group.id} className="bg-white rounded-xl border p-2 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-12 w-12 rounded-lg">
                                                <AvatarImage src={group.profileImageUrl || undefined} />
                                                <AvatarFallback className="bg-[#800517]/10 text-[#800517]">
                                                    {group.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-900">{group.name}</h4>
                                                <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2">{group.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-400">{group.membersCount || 0} members</span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="p-2 text-xs rounded-full border-slate-300 text-slate-600"
                                                    >
                                                        View Group
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border p-8 text-center">
                                <Grid className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                <h3 className="font-semibold text-lg mb-2">No Groups Yet</h3>
                                <p className="text-slate-500">This community doesn't have any groups yet.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="members" className="mt-6">
                        {selectedCommunity.memberships && selectedCommunity.memberships.length > 0 ? (
                            <div className="bg-white rounded-xl border divide-y">
                                {selectedCommunity.memberships.map((membership: any) => (
                                    <div key={membership.id} className="flex items-center gap-3 p-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={membership.user.avatarUrl || undefined} className="object-cover" />
                                            <AvatarFallback className="bg-slate-200 text-slate-600">
                                                {membership.user.firstName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">
                                                    {membership.userId === currentUserId ? 'You' : `${membership.user.firstName} ${membership.user.lastName}`}
                                                </span>
                                                {membership.role === 'admin' && (
                                                    <span className="text-xs bg-[#800517]/10 text-[#800517] px-2 py-0.5 rounded-full">
                                                        Admin
                                                    </span>
                                                )}
                                                {membership.userId === currentUserId && (
                                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Joined {formatRelativeTime(membership.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border p-8 text-center">
                                <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                <h3 className="font-semibold text-lg mb-2">No Members Yet</h3>
                                <p className="text-slate-500">Be the first to join this community!</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
