"use client";

import { ChevronLeft, Bell, Settings, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/common/Header";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  avatar?: string;
  unread: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.NOTIFICATIONS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-20 pb-10">
                <div className="max-w-2xl mx-auto">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b sticky top-20 bg-white z-10 md:hidden">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-1 hover:bg-secondary rounded-full">
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <h1 className="font-bold text-xl">Notifications</h1>
                        </div>
                        <button className="p-2 hover:bg-secondary rounded-full">
                            <Settings className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Desktop Title (optional as it's already in the header but nice to have) */}
                    <div className="hidden md:flex items-center justify-between px-4 py-6">
                        <h1 className="font-bold text-2xl">Notifications</h1>
                        <button className="p-2 hover:bg-secondary rounded-full">
                            <Settings className="h-6 w-6 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="flex flex-col">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex gap-4 px-4 py-4 cursor-pointer hover:bg-secondary/50 transition-colors relative border-b last:border-0 ${notif.unread ? "bg-primary/5" : ""}`}
                                >
                                    <Avatar className="h-14 w-14 flex-shrink-0">
                                        <AvatarImage src={notif.avatar} />
                                        <AvatarFallback>{notif.title[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-base leading-tight mb-1.5 ${notif.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                            {notif.description}
                                        </p>
                                        <span className="text-sm text-muted-foreground">{notif.time}</span>
                                    </div>
                                    {notif.unread && (
                                        <div className="w-2.5 h-2.5 bg-primary rounded-full absolute right-4 top-1/2 -translate-y-1/2" />
                                    )}
                                    <button className="p-1 hover:bg-secondary rounded-full transition-all self-center">
                                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-40 text-center text-muted-foreground">
                                <Bell className="h-20 w-20 mx-auto mb-6 opacity-10" />
                                <h2 className="text-xl font-medium mb-2">No notifications yet</h2>
                                <p>We'll notify you when something important happens.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
