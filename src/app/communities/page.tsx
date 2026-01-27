"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Search, Plus, Users } from "lucide-react";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  isMember: boolean;
  members?: any[];
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${ENDPOINTS.COMMUNITIES}?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to load communities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchCommunities();
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
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
      console.error("Error searching communities:", error);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.JOIN_COMMUNITY(communityId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Joined community successfully!");
        fetchCommunities();
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Communities</h1>
            <Link href="/communities/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Community
              </Button>
            </Link>
          </div>

          {/* Search Section */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              className="pl-10 rounded-full h-12"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Communities Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <Link key={community.id} href={`/communities/${community.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-2">
                            {community.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Created by {community.creator.firstName}{" "}
                            {community.creator.lastName}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {community.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {community.members?.length || 0} members
                      </div>

                      <Button
                        className="w-full"
                        variant={community.isMember ? "secondary" : "default"}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!community.isMember) {
                            handleJoinCommunity(community.id);
                          }
                        }}
                      >
                        {community.isMember ? "Member" : "Join"}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">No communities found</p>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}