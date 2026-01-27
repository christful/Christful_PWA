"use client";
import { Button } from "@/components/ui/button";
import { Plus, BookOpenText, Handshake, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";

interface Community {
  id: string;
  name: string;
  avatarUrl?: string;
  isMember: boolean;
}

export function CommunityPanel() {
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [otherCommunities, setOtherCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${ENDPOINTS.COMMUNITIES}?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const communities = data.communities || [];
        setUserCommunities(communities.filter((c: Community) => c.isMember).slice(0, 7));
        setOtherCommunities(communities.filter((c: Community) => !c.isMember).slice(0, 7));
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setIsLoading(false);
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
        toast.success("Joined community!");
        fetchCommunities();
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5">
          <div className="flex gap-10 items-center">
            <h1 className="text-[20px] font-medium text-[#556B2F]">Communities</h1>
            <Link href="/communities">
              <span className="text-sm text-foreground">
                <MoreHorizontal size={20} />
              </span>
            </Link>
          </div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : userCommunities.length > 0 ? (
            userCommunities.map((community) => (
              <Link key={community.id} href={`/communities/${community.id}`}>
                <div className="flex gap-3 items-start">
                  <Avatar>
                    <AvatarImage src={community.avatarUrl} />
                    <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-base font-semibold text-medium text-[14px]">
                      {community.name}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No communities yet</div>
          )}
        </div>
        <hr />
        <div className="flex flex-col gap-5">
          <div className="flex gap-10 items-center">
            <h1 className="text-[20px] font-medium text-[#556B2F]">Join Communities</h1>
            <Link href="/communities">
              <span className="text-sm text-foreground">
                <MoreHorizontal size={20} />
              </span>
            </Link>
          </div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : otherCommunities.length > 0 ? (
            otherCommunities.map((community) => (
              <div key={community.id} className="flex gap-3 items-start justify-between">
                <div className="flex gap-3 items-start flex-1">
                  <Avatar>
                    <AvatarImage src={community.avatarUrl} />
                    <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-base font-semibold text-medium text-[14px]">
                      {community.name}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleJoinCommunity(community.id)}
                  className="text-xs"
                >
                  Join
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No other communities</div>
          )}
        </div>
      </div>
    </div>
  );
}