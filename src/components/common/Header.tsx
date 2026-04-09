"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, House, Users, Plus, User, LogOut, Clapperboard, Menu, X, Mail, UserCircle, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/common/NotificationBell";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ENDPOINTS } from "@/lib/api-config";
import { SideNav } from "@/components/features/SideNav";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/common/PostCard";

export function Header() {
  const [user, setUser] = useState<{ id?: string; firstName: string; lastName?: string; avatarUrl?: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const mobileNavItems = [
    { href: "/home", label: "Home", icon: House },
    { href: "/communities", label: "Communities", icon: Users },
    { href: "/video", label: "Reels", icon: Clapperboard },
    { href: "/messages", label: "Messages", icon: Mail },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const fetchNotificationCount = useCallback(async (token: string) => {
    try {
      const response = await fetch(ENDPOINTS.NOTIFICATIONS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Notification count response:", data);
        const notifs = Array.isArray(data) ? data : data.notifications || [];
        const unreadCount = notifs.filter((n: any) => n.isRead === false).length;
        setNotifCount(unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      window.location.href = "/auth/login";
    }
  }, []);

  const fetchUserData = useCallback(async (token: string) => {
    try {
      const response = await fetch(ENDPOINTS.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        // Store user info for later use
        if (data.id) localStorage.setItem("userId", data.id);
        if (data.firstName) localStorage.setItem("userName", data.firstName);
        if (data.avatarUrl) localStorage.setItem("userAvatar", data.avatarUrl);
      } else if (response.status === 401) {
        handleLogout();
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserData(token);
      fetchNotificationCount(token);
    }
  }, [fetchUserData, fetchNotificationCount]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsLoggedIn(false);
    setUser(null);
    window.location.reload();
    window.location.href = "/auth/login";
  };

  const handleResultClick = (item: any) => {
    setIsModalOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    if (item.type === 'post') router.push(`/posts/${item.data.id}`);
    else if (item.type === 'reel') router.push(`/video?id=${item.data.id}`);
    else if (item.type === 'user') router.push(`/profile/${item.data.id}`);
    else if (item.type === 'community') router.push(`/communities/${item.data.id}`);
  };

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!searchResults) return null;

    const allResults = [
      ...(searchResults.users || []).map((u: any) => ({ type: 'user', data: u })),
      ...(searchResults.communities || []).map((c: any) => ({ type: 'community', data: c })),
      ...(searchResults.posts || []).map((p: any) => ({ type: 'post', data: p })),
      ...(searchResults.reels || []).map((r: any) => ({ type: 'reel', data: r })),
    ];

    if (allResults.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No search results found</p>
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        {allResults.map((item, index) => (
          <div key={index} onClick={() => handleResultClick(item)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {item.type === 'post' || item.type === 'reel' ? (
              <div className="border-b border-gray-100 dark:border-gray-700">
                <PostCard
                  postId={item.data.id}
                  postType={item.data.videoUrl ? 'video' : item.data.audioUrl ? 'audio' : item.data.imageUrl ? 'image' : 'text'}
                  authorId={item.data.author?.id || ''}
                  authorName={`${item.data.author?.firstName || ''} ${item.data.author?.lastName || ''}`.trim()}
                  authorAvatar={item.data.author?.avatarUrl || ''}
                  date={item.data.createdAt ? new Date(item.data.createdAt).toLocaleDateString() : ''}
                  textContent={item.data.content}
                  imageUrl={item.data.imageUrl}
                  videoUrl={item.data.videoUrl}
                  audioUrl={item.data.audioUrl}
                  likesCount={item.data.likes?.length || 0}
                  commentsCount={item.data.comments?.length || 0}
                  isSaved={item.data.isSaved}
                  isLiked={item.data.isLiked}
                  isReel={item.type === 'reel'}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 min-h-[48px] border-b border-gray-100 dark:border-gray-700">
                <div className="flex-shrink-0">
                  {item.type === 'user' && (
                    item.data.avatarUrl ? (
                      <img
                        src={item.data.avatarUrl}
                        alt={item.data.firstName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-8 h-8 text-gray-400" />
                    )
                  )}
                  {item.type === 'community' && (
                    item.data.avatarUrl ? (
                      <img
                        src={item.data.avatarUrl}
                        alt={item.data.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UsersRound className="w-8 h-8 text-gray-400" />
                    )
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {item.type === 'user'
                      ? `${item.data.firstName || ''} ${item.data.lastName || ''}`.trim() || item.data.username || 'Unknown User'
                      : item.data.name || item.data.communityName || 'Unknown Community'
                    }
                  </div>
                  {item.type === 'user' && item.data.username && (
                    <div className="text-xs text-gray-500 truncate">@{item.data.username}</div>
                  )}
                  {item.type === 'community' && item.data.description && (
                    <div className="text-xs text-gray-500 truncate">{item.data.description}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 z-50 transition-all duration-300">
      <div className="max-w-full mx-auto flex items-center justify-between px-[10px] py-3">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link href="/home">
            <img src="/logo.png" alt="Christful Logo" className="w-[100px] h-auto" />
          </Link>


          <div className="relative hidden lg:block">
            <Popover open={isModalOpen && !isMobile} onOpenChange={setIsModalOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search Christful..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      if (event.target.value.trim()) {
                        performSearch(event.target.value);
                        setIsModalOpen(true);
                      } else {
                        setIsModalOpen(false);
                        setSearchResults(null);
                      }
                    }}
                    className="pl-10 pr-10 rounded-full w-64 bg-gray-100 dark:bg-gray-800 border-none h-10 focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults(null);
                        setIsModalOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg mt-2" align="start">
                {renderSearchResults()}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Center (Desktop/Tablet) */}
        <div className="hidden md:flex items-center gap-6 lg:gap-12 xl:gap-20">
          <Link href="/home" className="group">
            <House className="h-6 w-6 text-muted-foreground cursor-pointer group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
          </Link>
          <Link href="/communities" className="group">
            <Users className="h-6 w-6 text-muted-foreground cursor-pointer group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
          </Link>
          <Link href="/video" title="Reels" className="hidden md:block group">
            <Clapperboard className="h-6 w-6 text-muted-foreground cursor-pointer group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
          </Link>
          <Link href="/messages" title="Messages" className="group">
            <svg className="h-6 w-6 text-muted-foreground cursor-pointer group-hover:text-primary transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-6 w-6 text-muted-foreground lg:hidden cursor-pointer hover:text-primary transition-all duration-300 hover:scale-110"
            aria-label="Search"
          >
            <Search className="h-6 w-6" />
          </button>

          <Link href="/video" className="md:hidden group">
            <Clapperboard className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/create">
              <Button className="hidden sm:flex items-center bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden lg:inline">Create</span>
              </Button>
            </Link>

            {/* Notification Bell with count */}
            <NotificationBell count={notifCount} />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Avatar className="cursor-pointer h-8 w-8 sm:h-10 w-10">
                {isLoggedIn && user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                ) : null}
                <AvatarFallback>
                  <User className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 mt-2" align="end">
              {isLoggedIn ? (
                <div className="flex flex-col gap-1">
                  <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
                    Hi, {user?.firstName || "User"}
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-secondary rounded-md cursor-pointer">
                    <User size={16} />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer w-full text-left"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-2">
                  <p className="text-sm text-muted-foreground text-center">Join our community to share the gospel</p>
                  <Link href="/auth/login" className="w-full">
                    <Button className="w-full bg-[#800517] text-white">Login</Button>
                  </Link>
                  <Link href="/auth/signup" className="w-full">
                    <Button variant="outline" className="w-full border-[#800517] text-[#800517]">Sign Up</Button>
                  </Link>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {isModalOpen && isMobile && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSearchQuery("");
                setSearchResults(null);
              }}
              className="p-2 -ml-2"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    performSearch(e.target.value);
                  } else {
                    setSearchResults(null);
                  }
                }}
                placeholder="Search Christful..."
                autoFocus
                className="pl-10 bg-gray-100 dark:bg-gray-800 border-none rounded-full h-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderSearchResults()}
          </div>
        </div>
      )}
    </header>
  );
}
