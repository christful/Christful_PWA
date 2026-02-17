"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import { Community } from "./types";
import { CommunityListSidebar } from "@/components/features/communities/CommunityListSidebar";
import { usePathname, useParams } from "next/navigation";

export default function CommunitiesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userCommunities, setUserCommunities] = useState<Community[]>([]);
    const [isLoadingUserCommunities, setIsLoadingUserCommunities] = useState(true);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const params = useParams();
    const selectedId = params.id as string;
    const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    useEffect(() => {
        fetchUserCommunities();
    }, []);

    const fetchUserCommunities = async () => {
        try {
            setIsLoadingUserCommunities(true);
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${ENDPOINTS.COMMUNITIES}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const payload = await response.json();
                const rawCommunities = payload?.communities || payload?.data?.communities || [];
                setUserCommunities(rawCommunities);
            }
        } catch (error) {
            console.error("Error fetching user communities:", error);
        } finally {
            setIsLoadingUserCommunities(false);
        }
    };

    const checkIsMember = (community: Community): boolean => {
        if (!currentUserId || !community.memberships) return false;
        return community.memberships.some((m) => m.userId === currentUserId);
    };

    const getUserRole = (community: Community | null): string | null => {
        if (!currentUserId || !community || !community.memberships) return null;
        const membership = community.memberships.find((m) => m.userId === currentUserId);
        return membership?.role || null;
    };

    const handleJoinCommunity = async (communityId: string) => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(ENDPOINTS.COMMUNITY_JOIN(communityId), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast.success("Joined community successfully!");
                fetchUserCommunities();
            }
        } catch (error) {
            console.error("Error joining community:", error);
            toast.error("Failed to join community");
        }
    };

    // Mock suggested communities data
    const suggestedCommunities = [
        {
            id: "s1",
            name: "Morning Prayer Warriors",
            members: "12.4k",
            avatarUrl: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=100&h=100&fit=crop"
        },
        {
            id: "s2",
            name: "Youth for Christ",
            members: "8.2k",
            avatarUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=100&h=100&fit=crop"
        },
        {
            id: "s3",
            name: "Daily Bible Study",
            members: "25.1k",
            avatarUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=100&h=100&fit=crop"
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header />

            {selectedId && !showMobileSidebar && (
                <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden fixed bottom-20 right-4 z-50 bg-[#800517] text-white p-3 rounded-full shadow-lg"
                >
                    <span className="sr-only">Toggle Sidebar</span>
                    <Menu className="h-6 w-6" />
                </button>
            )}

            <PageGrid
                left={
                    <CommunityListSidebar
                        showMobileSidebar={showMobileSidebar}
                        isLoadingUserCommunities={isLoadingUserCommunities}
                        userCommunities={userCommunities}
                        checkIsMember={checkIsMember}
                        getUserRole={getUserRole}
                        suggestedCommunities={suggestedCommunities}
                        handleJoinCommunity={handleJoinCommunity}
                    />
                }
                center={children}
                leftMobileVisibility={!selectedId || showMobileSidebar ? "block" : "hidden"}
                centerMobileVisibility={selectedId && !showMobileSidebar ? "block" : "hidden"}
                centerFullWidth
            />
            <BottomNav />
        </div>
    );
}
