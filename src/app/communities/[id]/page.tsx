"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft, Settings, Plus, Globe, Users as UsersIcon, Info, Image as ImageIcon, Calendar, ShieldCheck, Search } from "lucide-react";
import { PostCard } from "@/components/common/PostCard";
import { PageGrid } from "@/components/common/PageGrid";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  coverUrl?: string;
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

  const fetchCommunityDetail = async () => {
    try {
      const token = localStorage.getItem("auth_token");
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

        if (meResponse.ok) {
          const meData = await meResponse.json();
          const userId = meData.id || meData.user?.id;
          const creatorCheck = userId === communityData.creator.id;
          setIsCreator(creatorCheck);
          setIsMember(communityData.memberships?.length > 0 || creatorCheck);
        }
      }
    } catch (error) {
      console.error("Error fetching community:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async (id: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.JOIN_COMMUNITY(id), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Joined community successfully!");
        fetchCommunityDetail();
      }
    } catch (error) {
      toast.error("Failed to join");
    }
  };

  const Sidebar = () => (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg mb-4 truncate">{community?.name}</h2>
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 bg-slate-50 text-[#800517]">
            <UsersIcon size={18} />
            <span className="font-semibold">Community Home</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-50">
            <Calendar size={18} />
            <span className="font-semibold">Events</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-50">
            <ImageIcon size={18} />
            <span className="font-semibold">Media</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-50">
            <UsersIcon size={18} />
            <span className="font-semibold">Members</span>
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Groups in Community</h3>
        <div className="space-y-2">
          {community?.groups?.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 text-xs">
                  {group.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-700 truncate">{group.name}</span>
              </div>
            </Link>
          ))}
          {(!community?.groups || community.groups.length === 0) && (
            <p className="text-xs text-slate-400 italic">No groups yet</p>
          )}
        </div>
      </div>
    </div>
  );

  const Feed = () => (
    <div className="space-y-4">
      {/* Community Cover & Header */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="h-48 sm:h-64 bg-slate-200 relative">
          {community?.coverUrl && <img src={community.coverUrl} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-md">
              <AvatarImage src={community?.avatarUrl} className="object-cover" />
              <AvatarFallback className="text-4xl bg-slate-100">{community?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2 mb-2">
              {!isMember ? (
                <Button className="bg-[#800517] hover:bg-[#a0061d] text-white px-8 h-10 rounded-lg" onClick={() => handleJoinCommunity(community!.id)}>
                  Join Group
                </Button>
              ) : (
                <Button variant="secondary" className="px-8 h-10 rounded-lg">
                  Joined
                </Button>
              )}
              <Button variant="secondary" size="icon" className="h-10 w-10"><Plus size={20} /></Button>
              <Button variant="secondary" size="icon" className="h-10 w-10"><Search size={20} /></Button>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{community?.name}</h1>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
            <Globe size={14} />
            <span>Public Group • {community?.memberships?.length || 0} members</span>
          </div>

          <div className="flex gap-4 border-t pt-2">
            <button className="text-[#800517] font-semibold border-b-4 border-[#800517] pb-2 px-2">Discussion</button>
            <button className="text-slate-500 font-semibold hover:bg-slate-50 pb-2 px-2 rounded-t-lg transition-colors">Featured</button>
            <button className="text-slate-500 font-semibold hover:bg-slate-50 pb-2 px-2 rounded-t-lg transition-colors">Members</button>
            <button className="text-slate-500 font-semibold hover:bg-slate-50 pb-2 px-2 rounded-t-lg transition-colors">Media</button>
          </div>
        </div>
      </div>

      {/* Post Input */}
      {isMember && (
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <Input
              placeholder={`Write something to ${community?.name}...`}
              className="rounded-full bg-slate-100 border-none h-10"
            />
          </div>
        </div>
      )}

      {/* Feed Placeholder */}
      <PostCard
        postId="welcome"
        postType="text"
        authorId={community?.creator.id || "1"}
        authorName={`${community?.creator.firstName} ${community?.creator.lastName}`}
        authorAvatar={community?.creator.avatarUrl || ""}
        date="Just now"
        textContent={`Welcome to ${community?.name}! Let's share the word of God together.`}
        likesCount={0}
        commentsCount={0}
      />
    </div>
  );

  const About = () => (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h3 className="font-bold text-lg mb-4">About</h3>
        <p className="text-sm text-slate-600 mb-6">{community?.description}</p>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Globe className="text-slate-400 mt-1" size={18} />
            <div>
              <p className="text-sm font-bold">Public</p>
              <p className="text-xs text-slate-500">Anyone can see who's in the group and what they post.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <UsersIcon className="text-slate-400 mt-1" size={18} />
            <div>
              <p className="text-sm font-bold">Visible</p>
              <p className="text-xs text-slate-500">Anyone can find this group.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-slate-400 mt-1" size={18} />
            <div>
              <p className="text-sm font-bold">General</p>
              <p className="text-xs text-slate-500">A community for spiritual growth.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h3 className="font-bold text-lg mb-2">Group Rules</h3>
        <div className="space-y-3">
          {[
            { t: "Be Kind and Courteous", d: "We're all in this together to create a welcoming environment." },
            { t: "No Hate Speech or Bullying", d: "Make sure everyone feels safe." }
          ].map((rule, i) => (
            <div key={i} className="border-b pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-bold flex gap-2"><span>{i + 1}.</span> {rule.t}</p>
              <p className="text-xs text-slate-500 mt-1">{rule.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800517]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <Header />
      <PageGrid
        left={<Sidebar />}
        center={<Feed />}
        right={<About />}
      />
      <BottomNav />
    </div>
  );
}