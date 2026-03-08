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
    const [suggestedCommunities, setSuggestedCommunities] = useState<any[]>([]);
    const [isLoadingSuggested, setIsLoadingSuggested] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const params = useParams();
    const selectedId = params.id as string;
    const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    useEffect(() => {
        fetchUserCommunities();
        fetchSuggestedCommunities();
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

    const fetchSuggestedCommunities = async () => {
        try {
            setIsLoadingSuggested(true);
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${ENDPOINTS.COMMUNITY_SUGGESTED}?page=1&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const payload = await response.json();
                // Expected shape: { communities: [...] } or { data: [...] }
                const rawSuggested = payload?.communities || payload?.data || [];
                
                // Map to the shape expected by CommunityListSidebar (id, name, avatarUrl, members)
                const mapped = rawSuggested.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    avatarUrl: c.avatarUrl || c.profileImageUrl || c.creator?.avatarUrl || null,
                    members: c.membersCount || c._count?.members || "0", // adjust based on actual API field
                }));
                setSuggestedCommunities(mapped.slice(0, 10));
            } else {
                console.error("Failed to fetch suggested communities:", response.status);
            }
        } catch (error) {
            console.error("Error fetching suggested communities:", error);
            toast.error("Failed to load suggestions");
        } finally {
            setIsLoadingSuggested(false);
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
                fetchUserCommunities(); // refresh user communities
                // Optionally remove from suggestions
                setSuggestedCommunities(prev => prev.filter(c => c.id !== communityId));
            } else {
                const error = await response.text();
                toast.error(error || "Failed to join community");
            }
        } catch (error) {
            console.error("Error joining community:", error);
            toast.error("Failed to join community");
        }
    };

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