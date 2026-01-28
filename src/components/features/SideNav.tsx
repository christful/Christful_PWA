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
    <div className="flex justify-center">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5">
          <Link href="/create">
            <Button className="rounded-full bg-secondary px-5 text-foreground w-fit hover:bg-secondary/80">
              <Plus /> Create
            </Button>
          </Link>
          <Button className="rounded-full bg-secondary px-5 text-foreground w-fit hover:bg-secondary/80">
            <BookOpenText /> Library
          </Button>
          <Button className="rounded-full bg-secondary px-5 text-foreground w-fit hover:bg-secondary/80">
            <Handshake /> Invite a Friend
          </Button>
        </div>
        <hr />
        <div className="flex flex-col gap-5">
          <div className="flex gap-10 items-center">
            <h1 className="text-[20px] font-medium text-[#556B2F]">Following</h1>
            <Link href="">
              <span className="text-sm text-foreground">
                <MoreHorizontal size={20} />
              </span>
            </Link>
          </div>
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