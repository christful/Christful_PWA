"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Community, Group } from "./types";
import { CommunityListSidebar } from "@/components/features/communities/CommunityListSidebar";
import { CommunityDetails } from "@/components/features/communities/CommunityDetails";
import { DiscoveryCenter } from "@/components/features/communities/DiscoveryCenter";

interface ApiResponse {
  communities: Community[];
}

export default function CommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUserCommunities, setIsLoadingUserCommunities] = useState(true);
  const [isLoadingCommunityDetails, setIsLoadingCommunityDetails] = useState(false);
  const [communityGroups, setCommunityGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState("about");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const { data, isLoading: apiLoading, mutate } = useApi<ApiResponse>(`${ENDPOINTS.COMMUNITIES}?limit=20`);

  // Get current user ID from localStorage
  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (data) {
      setCommunities(data.communities || []);
    }
  }, [data]);

  useEffect(() => {
    setIsLoading(apiLoading);
  }, [apiLoading]);

  // Fetch user communities on mount
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

  const fetchCommunityDetails = async (communityId: string) => {
    try {
      setIsLoadingCommunityDetails(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(ENDPOINTS.COMMUNITY_DETAIL(communityId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const communityData = await response.json();
        setSelectedCommunity(communityData);
        setCommunityGroups(communityData.groups || []);
      } else {
        toast.error("Failed to load community details");
      }
    } catch (error) {
      console.error("Error fetching community details:", error);
      toast.error("Failed to load community details");
    } finally {
      setIsLoadingCommunityDetails(false);
    }
  };

  const handleCommunityClick = (community: Community) => {
    setSelectedCommunity(community);
    setShowMobileSidebar(false);
    fetchCommunityDetails(community.id);
    setActiveTab("about");
  };

  const handleBackToDiscovery = () => {
    setSelectedCommunity(null);
    setCommunityGroups([]);
    setShowMobileSidebar(true);
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
        mutate();
        fetchUserCommunities();

        if (selectedCommunity?.id === communityId) {
          fetchCommunityDetails(communityId);
        }
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const checkIsMember = (community: Community): boolean => {
    if (!currentUserId || !community.memberships) return false;
    return community.memberships.some(m => m.userId === currentUserId);
  };

  const getUserRole = (community: Community | null): string | null => {
    if (!currentUserId || !community || !community.memberships) return null;
    const membership = community.memberships.find(m => m.userId === currentUserId);
    return membership?.role || null;
  };

  const fetchCommunities = async () => {
    await mutate();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchCommunities();
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please login first");
        return;
      }

      const response = await fetch(
        `${ENDPOINTS.COMMUNITY_SEARCH}?q=${query}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Search failed");
    }
  };

  // Mock suggested communities data (you can replace with real data)
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

      {selectedCommunity && !showMobileSidebar && (
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
            selectedCommunity={selectedCommunity}
            showMobileSidebar={showMobileSidebar}
            handleBackToDiscovery={handleBackToDiscovery}
            isLoadingUserCommunities={isLoadingUserCommunities}
            userCommunities={userCommunities}
            checkIsMember={checkIsMember}
            getUserRole={getUserRole}
            handleCommunityClick={handleCommunityClick}
            suggestedCommunities={suggestedCommunities}
            handleJoinCommunity={handleJoinCommunity}
          />
        }
        center={
          selectedCommunity ? (
            <CommunityDetails
              selectedCommunity={selectedCommunity}
              showMobileSidebar={showMobileSidebar}
              handleBackToDiscovery={handleBackToDiscovery}
              isLoadingCommunityDetails={isLoadingCommunityDetails}
              handleJoinCommunity={handleJoinCommunity}
              currentUserId={currentUserId}
              checkIsMember={checkIsMember}
              getUserRole={getUserRole}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          ) : (
            <DiscoveryCenter
              selectedCommunity={selectedCommunity}
              showMobileSidebar={showMobileSidebar}
            />
          )
        }
        leftMobileVisibility={!selectedCommunity || showMobileSidebar ? "block" : "hidden"}
        centerMobileVisibility={selectedCommunity && !showMobileSidebar ? "block" : "hidden"}
        centerFullWidth
      />
      <BottomNav />
    </div>
  );
}