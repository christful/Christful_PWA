"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Community } from "../types";
import { CommunityDetails } from "@/components/features/communities/CommunityDetails";

export default function CommunityDetailPage() {
  const params = useParams();
  const communityId = params.id as string;
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [isLoadingCommunityDetails, setIsLoadingCommunityDetails] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (communityId) {
      fetchCommunityDetails(communityId);
    }
  }, [communityId]);

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
        fetchCommunityDetails(communityId);
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

  return (
    <CommunityDetails
      selectedCommunity={selectedCommunity}
      showMobileSidebar={showMobileSidebar}
      isLoadingCommunityDetails={isLoadingCommunityDetails}
      handleJoinCommunity={handleJoinCommunity}
      currentUserId={currentUserId}
      checkIsMember={checkIsMember}
      getUserRole={getUserRole}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}