"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { 
  Search, Plus, Users, Globe, Settings, MoreHorizontal, 
  Heart, MessageCircle, Sparkles, Grid, BookOpen, 
  Calendar, ArrowLeft, Shield, UserPlus, Flag, Menu
} from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/common/PostCard";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date-utils";

interface Community {
  id: string;
  name: string;
  description: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  isPrivate: boolean;
  createdAt: string;
  createdBy: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  memberships: Array<{
    id: string;
    userId: string;
    role: string;
    createdAt: string;
  }>;
  groups?: Group[];
  stats?: {
    membersCount: number;
    groupsCount: number;
    postsCount: number;
  };
}

interface Group {
  id: string;
  name: string;
  description: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  createdAt: string;
  membersCount?: number;
  isJoined?: boolean;
}

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

  const { data, error, isLoading: apiLoading, mutate } = useApi<ApiResponse>(`${ENDPOINTS.COMMUNITIES}?limit=20`);

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
        console.log(rawCommunities)
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
      
      // Fetch community details
      const response = await fetch(ENDPOINTS.COMMUNITY_DETAIL(communityId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const communityData = await response.json();
        console.log("Community details:", communityData);
        
        // Set the selected community with all the details
        setSelectedCommunity(communityData);
        
        // Set groups from the community data
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
    // Set a basic version immediately for better UX
    setSelectedCommunity(community);
    setShowMobileSidebar(false);
    // Then fetch full details
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
        fetchCommunities();
        fetchUserCommunities();
        
        // Refresh community details if it's the selected one
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

  const getUserRole = (community: Community): string | null => {
    if (!currentUserId || !community.memberships) return null;
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

  const CommunityListSidebar = () => (
    <div className={cn(
      "bg-white md:rounded-xl shadow-sm border h-full flex flex-col overflow-hidden border-x-0 md:border-x",
      "md:block",
      selectedCommunity && !showMobileSidebar ? "hidden md:block" : "block"
    )}>
      <div className="p-5 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-slate-900">Communities</h2>
          <Link href="/communities/create">
            <Button variant="ghost" size="icon" className="bg-slate-100 rounded-full hover:bg-[#800517] hover:text-white transition-all">
              <Plus size={20} />
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {/* Navigation Links */}
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 h-12 rounded-lg",
              !selectedCommunity && "bg-slate-100 text-[#800517]"
            )}
            onClick={handleBackToDiscovery}
          >
            <div className={cn(
              "p-2 rounded-lg",
              !selectedCommunity ? "bg-[#800517] text-white" : "bg-slate-100 text-slate-600"
            )}>
              <Globe size={18} />
            </div>
            <span className="font-semibold">Discover</span>
          </Button>
        </div>

        {/* Your Communities */}
        <div className="mt-6">
          <h3 className="px-3 text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Your Communities
          </h3>
          {isLoadingUserCommunities ? (
            <div className="py-4 flex justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-[#800517] border-t-transparent rounded-full"></div>
            </div>
          ) : userCommunities.length > 0 ? (
            userCommunities.map((community) => {
              const isMember = checkIsMember(community);
              const userRole = getUserRole(community);
              
              return (
                <div
                  key={community.id}
                  onClick={() => handleCommunityClick(community)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors group",
                    selectedCommunity?.id === community.id 
                      ? "bg-[#800517]/10 border-l-4 border-[#800517]" 
                      : "hover:bg-slate-50"
                  )}
                >
                  <Avatar className="h-10 w-10 rounded-lg border">
                    <AvatarImage src={community.profileImageUrl || undefined} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                      {community.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium block truncate",
                        selectedCommunity?.id === community.id ? "text-[#800517]" : "text-slate-700 group-hover:text-[#800517]"
                      )}>
                        {community.name}
                      </span>
                      {userRole === 'admin' && (
                        <Shield className="h-3 w-3 text-[#800517]" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {community.memberships?.length || 0} members
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500 px-3 py-2">
              You haven't joined any communities yet
            </p>
          )}
        </div>

        {/* Suggested Communities */}
        <div className="mt-6">
          <h3 className="px-3 text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Suggested For You
          </h3>
          <div className="space-y-2">
            {suggestedCommunities.map((comm) => (
              <div key={comm.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <Avatar className="h-10 w-10 rounded-lg border">
                  <AvatarImage src={comm.avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-slate-100 text-slate-600">
                    {comm.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{comm.name}</p>
                  <p className="text-xs text-slate-500">{comm.members} members</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-[#800517] text-[#800517] hover:bg-[#800517] hover:text-white rounded-full px-4"
                  onClick={() => handleJoinCommunity(comm.id)}
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const CommunityDetails = () => {
    if (!selectedCommunity) return null;
    
    const isMember = checkIsMember(selectedCommunity);
    const userRole = getUserRole(selectedCommunity);
    const creatorName = selectedCommunity.creator 
      ? `${selectedCommunity.creator.firstName} ${selectedCommunity.creator.lastName}`
      : 'Unknown';

    // Show loading state while fetching details
    if (isLoadingCommunityDetails) {
      return (
        <div className="w-full max-w-4xl mx-auto flex items-center justify-center min-h-[70vh]">
          <div className="animate-spin h-8 w-8 border-2 border-[#800517] border-t-transparent rounded-full"></div>
        </div>
      );
    }

    return (
      <div className={cn(
        "w-full max-w-4xl mx-auto",
        "block",
        selectedCommunity && !showMobileSidebar ? "block" : "hidden md:block"
      )}>
        {/* Mobile Header with Back Button */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b bg-white">
          <button
            onClick={handleBackToDiscovery}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <h2 className="font-semibold text-lg truncate">{selectedCommunity.name}</h2>
        </div>

        {/* Cover Image */}
        <div className="relative h-48 md:h-64 rounded-t-2xl overflow-hidden bg-gradient-to-br from-[#800517]/20 to-[#600412]/20">
          {selectedCommunity.coverImageUrl ? (
            <Image
              src={selectedCommunity.coverImageUrl}
              alt={selectedCommunity.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#800517]/10 to-[#600412]/10">
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            </div>
          )}
          
          {/* Desktop Back Button */}
          <button
            onClick={handleBackToDiscovery}
            className="hidden md:block absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>

          {/* Community Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <Avatar className="h-24 w-24 rounded-2xl border-4 border-white shadow-xl">
                <AvatarImage src={selectedCommunity.profileImageUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-[#800517] text-white text-3xl">
                  {selectedCommunity.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {userRole === 'admin' && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full">
                  <Shield className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Community Info */}
        <div className="mt-16 px-4 md:px-6 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{selectedCommunity.name}</h1>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 text-xs md:text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedCommunity.memberships?.length || 0} members
                </span>
                <span className="flex items-center gap-1">
                  <Grid className="h-4 w-4" />
                  {selectedCommunity.groups?.length || 0} groups
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {formatRelativeTime(selectedCommunity.createdAt)}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Created by {creatorName}
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {!isMember && (
                <Button 
                  className="bg-[#800517] hover:bg-[#600412] text-white flex-1 md:flex-none"
                  onClick={() => handleJoinCommunity(selectedCommunity.id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Community
                </Button>
              )}
              {isMember && userRole === 'admin' && (
                <Button variant="outline" className="border-slate-300 flex-1 md:flex-none">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              )}
              {isMember && userRole !== 'admin' && (
                <Button variant="outline" className="border-slate-300 flex-1 md:flex-none">
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </Button>
              )}
              {!isMember && (
                <Button variant="outline" className="border-slate-300 flex-1 md:flex-none">
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
              <TabsTrigger 
                value="about" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#800517] data-[state=active]:text-[#800517] px-4 py-2 text-sm"
              >
                About
              </TabsTrigger>
              <TabsTrigger 
                value="groups" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#800517] data-[state=active]:text-[#800517] px-4 py-2 text-sm"
              >
                Groups ({selectedCommunity.groups?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="members" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#800517] data-[state=active]:text-[#800517] px-4 py-2 text-sm"
              >
                Members ({selectedCommunity.memberships?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <div className="bg-white rounded-xl border p-4 md:p-6">
                <h3 className="font-semibold text-lg mb-3">Description</h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  {selectedCommunity.description || "No description provided."}
                </p>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-lg mb-3">Community Details</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-slate-500">Privacy</dt>
                      <dd className="font-medium">{selectedCommunity.isPrivate ? 'Private' : 'Public'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500">Created</dt>
                      <dd className="font-medium">{new Date(selectedCommunity.createdAt).toLocaleDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500">Members</dt>
                      <dd className="font-medium">{selectedCommunity.memberships?.length || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500">Groups</dt>
                      <dd className="font-medium">{selectedCommunity.groups?.length || 0}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-6">
              {selectedCommunity.groups && selectedCommunity.groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCommunity.groups.map((group) => (
                    <div key={group.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 rounded-lg">
                          <AvatarImage src={group.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-[#800517]/10 text-[#800517]">
                            {group.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{group.name}</h4>
                          <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2">{group.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-slate-400">{group.membersCount || 0} members</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs rounded-full border-slate-300 text-slate-600"
                            >
                              View Group
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border p-8 text-center">
                  <Grid className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">No Groups Yet</h3>
                  <p className="text-slate-500">This community doesn't have any groups yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              {selectedCommunity.memberships && selectedCommunity.memberships.length > 0 ? (
                <div className="bg-white rounded-xl border divide-y">
                  {selectedCommunity.memberships.map((membership) => (
                    <div key={membership.id} className="flex items-center gap-3 p-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-slate-200 text-slate-600">
                          {membership.userId.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {membership.userId === currentUserId ? 'You' : `User ${membership.userId.slice(0, 8)}`}
                          </span>
                          {membership.role === 'admin' && (
                            <span className="text-xs bg-[#800517]/10 text-[#800517] px-2 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                          {membership.userId === currentUserId && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Joined {formatRelativeTime(membership.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">No Members Yet</h3>
                  <p className="text-slate-500">Be the first to join this community!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  const DiscoveryCenter = () => (
    <div className={cn(
      "w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[70vh] px-4 relative",
      "md:block",
      !selectedCommunity || showMobileSidebar ? "block" : "hidden md:block"
    )}>
      {/* Brick Red Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#800517]/5 blur-3xl"></div>
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-[#800517]/10 blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full bg-[#800517]/10 blur-xl"></div>
        
        <svg className="absolute top-0 left-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#800517" strokeWidth="1" strokeOpacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute bottom-10 right-10 opacity-10">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-[#800517]" />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-6">
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#800517]/20 rounded-full blur-xl"></div>
            <div className="relative w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Users className="w-10 h-10 text-[#800517]" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Find Your <span className="text-[#800517]">Community</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-lg mx-auto">
          Create a space for your community to grow, share, and connect with like-minded people.
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/communities/create">
            <Button className="bg-[#800517] hover:bg-[#600412] text-white font-medium px-8 py-6 rounded-full text-base md:text-lg shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              Create a Community
            </Button>
          </Link>
          
          <Button variant="outline" className="border-[#800517] text-[#800517] hover:bg-[#800517]/5 px-8 py-6 rounded-full text-base md:text-lg w-full sm:w-auto">
            <Sparkles className="mr-2 h-5 w-5" />
            Explore
          </Button>
        </div>

        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#800517]/60" />
            <span>1.2k+ communities</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#800517]/60" />
            <span>50k+ members</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      
      {/* Mobile Menu Button */}
      {selectedCommunity && !showMobileSidebar && (
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="md:hidden fixed bottom-20 right-4 z-50 bg-[#800517] text-white p-3 rounded-full shadow-lg"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      <PageGrid
        left={<CommunityListSidebar />}
        center={
          isLoadingCommunityDetails ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-[#800517] border-t-transparent rounded-full"></div>
            </div>
          ) : selectedCommunity ? (
            <CommunityDetails />
          ) : (
            <DiscoveryCenter />
          )
        }
        leftMobileVisibility="block"
        centerMobileVisibility="hidden"
        centerFullWidth
      />
      <BottomNav />
    </div>
  );
}