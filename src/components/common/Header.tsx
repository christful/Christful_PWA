"use client";

import { useState, useEffect } from "react";
import { Search, House, Users, Plus, User, LogOut, Video } from "lucide-react";
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
import { ENDPOINTS } from "@/lib/api-config";

export function Header() {
  const [user, setUser] = useState<{ id?: string; firstName: string; lastName?: string; avatarUrl?: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserData(token);
      fetchNotificationCount(token);
    }
  }, []);

  const fetchNotificationCount = async (token: string) => {
    try {
      const response = await fetch(ENDPOINTS.NOTIFICATIONS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const notifs = Array.isArray(data) ? data : data.notifications || [];
        const unreadCount = notifs.filter((n: any) => n.isRead === false).length;
        setNotifCount(unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch(ENDPOINTS.ME, {
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
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsLoggedIn(false);
    setUser(null);
    window.location.reload();
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white fixed top-0 left-0 right-0 z-50">
      {/* Left */}
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Christful Logo" width={80} height={80} />

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sermons..."
            className="pl-10 rounded-full w-64"
          />
        </div>
      </div>

      {/* Center (Desktop only) */}
      <div className="hidden md:flex items-center gap-20 mr-35">
        <Link href="/home">
          <House className="h-6 w-6 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </Link>
        <Link href="/communities">
          <Users className="h-6 w-6 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </Link>
        <Link href="/video" title="Videos">
          <Video className="h-6 w-6 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </Link>
        <Link href="/messages" title="Messages">
          <svg className="h-6 w-6 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </Link>
      </div>

      {/* Right */}
      <div className="flex items-center gap-8">
        <Search className="h-6 w-6 text-muted-foreground md:hidden cursor-pointer" />

        <div className="flex items-center gap-4">
          <Link href="/create">
            <Button className="hidden md:flex items-center bg-[#800517]">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </Link>

          {/* Notification Bell with count */}
          <NotificationBell count={notifCount} />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Avatar className="hidden md:flex cursor-pointer">
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
                  <Button variant="secondary" className="w-full">Login</Button>
                </Link>
                <Link href="/auth/signup" className="w-full">
                  <Button variant="secondary" className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
