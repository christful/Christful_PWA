"use client";
import { Button } from "@/components/ui/button";
import { Plus, BookOpenText, Handshake, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";

interface Community {
  creatorId: string | null;
  id: string;
  name: string;
  avatarUrl?: string;
  isMember: boolean;
}

export function CommunityPanel() {
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dummy suggested communities
  const suggestedCommunities = [
    { id: "s1", name: "Morning Prayer Warriors", members: "12.4k", avatarUrl: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=100&h=100&fit=crop" },
    { id: "s2", name: "Youth for Christ", members: "8.2k", avatarUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=100&h=100&fit=crop" },
    { id: "s3", name: "Daily Bible Study", members: "25.1k", avatarUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=100&h=100&fit=crop" },
  ];

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");
      // Use a larger limit to ensure we find joined communities if there are many
      const response = await fetch(`${ENDPOINTS.COMMUNITIES}?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const communities = data.communities || [];
        // Filter those where the user is a member or creator
        const userId = localStorage.getItem("userId");
        const joined = communities.filter((c: Community) =>
          c.isMember || c.creatorId === userId
        );
        setUserCommunities(joined.slice(0, 10));
      } else {
        console.error("Failed to fetch communities:", response.status);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = (id: string) => {
    toast.success("Request sent to join!");
  };

  return (
    <div className="w-full space-y-4">
      {/* Professional Graphic Area */}
      <div className="relative h-40 rounded-xl overflow-hidden shadow-sm group">
        <img
          src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&h=300&fit=crop"
          alt="Community Graphic"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
          <h2 className="text-white font-bold text-lg leading-tight">Grow with the Body of Christ</h2>
          <p className="text-white/70 text-xs">Join thousands in faith-based circles</p>
        </div>
      </div>

      {/* Suggested Communities */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Suggested for You</h3>
          <span className="text-[10px] font-bold text-[#800517] uppercase tracking-wider cursor-pointer hover:underline">See All</span>
        </div>
        <div className="space-y-4">
          {suggestedCommunities.map((comm) => (
            <div key={comm.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comm.avatarUrl} className="object-cover" />
                <AvatarFallback>{comm.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{comm.name}</p>
                <p className="text-[10px] text-slate-500">{comm.members} members</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-[#800517] text-[#800517] hover:bg-[#800517] hover:text-white"
                onClick={() => handleJoinCommunity(comm.id)}
              >
                Join
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Your Communities */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-bold text-slate-800 mb-4">Your Communities</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-[#800517] border-t-transparent rounded-full"></div>
            </div>
          ) : userCommunities.length > 0 ? (
            userCommunities.map((community) => (
              <div key={community.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={community.avatarUrl} className="object-cover" />
                  <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{community.name}</p>
                  <p className="text-[10px] text-slate-500">Member</p>
                </div>
                <Link href={`/communities/${community.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    View
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-slate-400 italic mb-2">No joined communities</p>
              <Link href="/communities">
                <Button variant="ghost" className="text-xs text-[#800517] font-bold">Discover Groups</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}