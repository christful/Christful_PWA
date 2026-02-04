"use client";
import { Button } from "@/components/ui/button";
import { Plus, BookOpenText, Handshake, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

export function SideNav() {
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, []); // Add empty dependency array

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) return;

      const response = await fetch(ENDPOINTS.FOLLOWING(userId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col gap-3">
          <Link href="/create" className="w-full">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-lg hover:bg-slate-50 text-[#800517]">
              <div className="bg-[#800517] text-white p-2 rounded-lg">
                <Plus size={18} />
              </div>
              <span className="font-semibold">Create Post</span>
            </Button>
          </Link>

          <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-lg hover:bg-slate-50">
            <div className="bg-slate-200 text-slate-600 p-2 rounded-lg">
              <BookOpenText size={18} />
            </div>
            <span className="font-semibold">Library</span>
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-lg hover:bg-slate-50">
            <div className="bg-slate-200 text-slate-600 p-2 rounded-lg">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span className="font-semibold">Saved</span>
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-lg hover:bg-slate-50">
            <div className="bg-slate-200 text-slate-600 p-2 rounded-lg">
              <Handshake size={18} />
            </div>
            <span className="font-semibold">Invite Friends</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Following</h3>
          <MoreHorizontal size={18} className="text-slate-400 cursor-pointer" />
        </div>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : following.length > 0 ? (
            following.map((user: any) => (
              <Link key={user.id} href={`/profile/${user.id}`}>
                <div className="flex gap-3 items-start">
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.firstName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-base font-semibold text-medium text-[14px]">
                      {user.firstName} {user.lastName}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No one following yet</div>
          )}
        </div>
      </div>
    </div>
  );
}