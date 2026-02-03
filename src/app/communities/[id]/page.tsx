"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft, Settings, Plus } from "lucide-react";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  memberships: any[];
  groups: any[];
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (communityId) {
      fetchCommunityDetail();
    }
  }, [communityId]);

  useEffect(() => {
    // Refresh groups every 3 seconds when on this page
    const interval = setInterval(() => {
      if (communityId) {
        fetchCommunityDetail();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [communityId]);

  const fetchCommunityDetail = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      // Fetch current user and community detail in parallel to safely determine creator status
      const [communityResponse, meResponse] = await Promise.all([
        fetch(ENDPOINTS.COMMUNITY_DETAIL(communityId), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(ENDPOINTS.ME, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (communityResponse.ok) {
        const communityData = await communityResponse.json();
        setCommunity(communityData);

        let creatorCheck = false;
        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (meData.user?.id === communityData.creator.id) {
            creatorCheck = true;
          }
        }
        setIsCreator(creatorCheck);
        setIsMember(communityData.memberships?.length > 0 || creatorCheck);
      } else {
        // Only redirect if it's the initial load to avoid jumping during refresh
        if (isLoading) {
          toast.error("Community not found");
          router.push("/communities");
        }
      }
    } catch (error) {
      console.error("Error fetching community:", error);
      if (isLoading) toast.error("Failed to load community");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async (id: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.JOIN_COMMUNITY(id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Joined community successfully!");
        fetchCommunityDetail();
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const handleLeaveCommunity = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.LEAVE_COMMUNITY(communityId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Left community successfully");
        router.push("/communities");
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Community not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 md:pb-0 relative">
      <Header />

      {/* WhatsApp-style Header for Community Detail */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-[#075E54] text-white shadow-md transition-all duration-300">
        <div className="flex items-center gap-3 px-4 h-[60px] max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold truncate flex-1">{community.name}</h1>
          <Settings className="h-6 w-6 cursor-pointer" />
        </div>
      </div>

      <div className="pt-[60px] pb-10">
        <div className="max-w-4xl mx-auto">

          {/* Community Info Card */}
          <div className="bg-white shadow-sm mb-4 px-4 py-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-4 border-[#F0F2F5]">
              <AvatarImage
                src={community.avatarUrl}
                alt={community.name}
                className="object-cover"
              />
              <AvatarFallback className="text-3xl bg-slate-200 text-slate-500">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">{community.name}</h2>
            <p className="text-slate-500 text-sm mb-4">
              Group • {community.memberships?.length || 0} participants
            </p>
            <p className="text-slate-600 text-sm max-w-lg mx-auto">
              {community.description}
            </p>

            <div className="mt-6 flex gap-3 w-full max-w-sm">
              {!isMember ? (
                <Button className="flex-1 bg-[#075E54] hover:bg-[#128C7E] rounded-full" onClick={() => handleJoinCommunity(community.id)}>
                  Join Community
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLeaveCommunity}>
                  Exit Community
                </Button>
              )}
            </div>
          </div>

          {/* Groups Section List */}
          <div className="bg-white shadow-sm mb-4">
            <div className="px-4 py-3 flex items-center justify-between border-b border-light">
              <h3 className="text-[#075E54] font-semibold text-sm">GROUPS IN THIS COMMUNITY</h3>
              {isMember && (
                <Link href={`/groups/create?communityId=${communityId}`}>
                  <Plus className="h-5 w-5 text-[#075E54] cursor-pointer" />
                </Link>
              )}
            </div>

            {community.groups && community.groups.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {community.groups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <div className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                        {group.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{group.name}</h4>
                        <p className="text-sm text-slate-500 truncate">{group.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                No groups created yet.
              </div>
            )}
          </div>

          {/* Creator Info (Small) */}
          <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Created by</span>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={community.creator.avatarUrl} />
                <AvatarFallback className="text-[10px]">{community.creator.firstName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-700 font-medium">
                {community.creator.firstName} {community.creator.lastName}
              </span>
            </div>
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}