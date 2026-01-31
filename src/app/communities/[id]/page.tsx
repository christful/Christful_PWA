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
  // refreshKey unused but kept for compatibility if needed, though interval drives it
  // const [refreshKey, setRefreshKey] = useState(0); 

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
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:underline mb-6"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Communities
          </button>

          {/* Community Header */}
          <Card className="mb-8 overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row gap-6 md:items-end md:-mt-20">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={community.avatarUrl}
                    alt={community.name}
                  />
                  <AvatarFallback className="text-2xl">
                    {community.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
                  <p className="text-muted-foreground mb-4">
                    {community.description}
                  </p>

                  <div className="flex gap-4 text-sm text-muted-foreground mb-6">
                    <div>
                      <div className="font-semibold text-foreground">
                        {community.memberships?.length || 0}
                      </div>
                      <div>Members</div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {community.groups?.length || 0}
                      </div>
                      <div>Groups</div>
                    </div>
                  </div>
                </div>

                {isCreator ? (
                  <div className="flex gap-2">
                    <Button variant="secondary">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                ) : isMember ? (
                  <div className="flex gap-2">
                    <Button variant="secondary">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleLeaveCommunity}
                    >
                      Leave
                    </Button>
                  </div>
                ) : (
                  <Button>Join Community</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Groups Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Groups in this Community</h2>
              {isMember && (
                <Link href={`/groups/create?communityId=${communityId}`}>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Button>
                </Link>
              )}
            </div>
            {community.groups && community.groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {community.groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="line-clamp-1">
                          {group.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {group.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <p className="text-muted-foreground mb-4">No groups yet</p>
                {isMember && (
                  <Link href={`/groups/create?communityId=${communityId}`}>
                    <Button size="sm">Create First Group</Button>
                  </Link>
                )}
              </Card>
            )}
          </div>

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle>Created by</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={community.creator.avatarUrl} />
                  <AvatarFallback>
                    {community.creator.firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {community.creator.firstName} {community.creator.lastName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}