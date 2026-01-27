"use client";

import { Bell, Settings, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/lib/api-config";

export function NotificationBell({ count = 3 }: { count?: number }) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(ENDPOINTS.NOTIFICATIONS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      router.push("/notifications");
    }
  };

  const BellIcon = (
    <div className="relative cursor-pointer p-2 hover:bg-secondary rounded-full transition-colors" onClick={handleClick}>
      <Bell className="h-6 w-6 text-muted-foreground" />
      {count > 0 && (
        <Badge className="absolute bg-destructive -top-0.5 -right-0.5 h-4.5 min-w-4.5 rounded-full px-1 text-[10px] flex items-center justify-center border-2 border-white">
          {count}
        </Badge>
      )}
    </div>
  );

  if (isMobile) return BellIcon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {BellIcon}
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0 mr-4 shadow-xl border-none rounded-xl overflow-hidden" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-lg">Notifications</h2>
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-[min(80vh,480px)] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors relative ${notif.isRead === false ? "bg-primary/5" : ""}`}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={notif.senderAvatar || notif.avatar} />
                    <AvatarFallback>{(notif.title || notif.type || "N")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight mb-1 ${notif.isRead === false ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {notif.message || notif.description || notif.title}
                    </p>
                    <span className="text-xs text-muted-foreground">{notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : notif.time}</span>
                  </div>
                  {notif.isRead === false && (
                    <div className="w-2 h-2 bg-primary rounded-full absolute right-4 top-1/2 -translate-y-1/2" />
                  )}
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded-full transition-all">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Your notifications live here</p>
            </div>
          )}
        </div>

        <div className="border-t p-2 text-center">
          <button
            onClick={() => router.push("/notifications")}
            className="text-sm font-medium text-primary hover:bg-primary/5 w-full py-2 rounded-md transition-colors"
          >
            View all notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

