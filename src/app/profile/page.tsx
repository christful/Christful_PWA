"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Mail, MapPin, Link as LinkIcon, Calendar, UserPlus, UserCheck } from "lucide-react";
import { PostCard } from "@/components/common/PostCard";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  avatarUrl: string;
  followers: any[];
  following: any[];
}

interface Post {
  id: string;
  content: string;
  author: UserProfile;
  likes: any[];
  comments: any[];
  mediaType?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(ENDPOINTS.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        fetchUserPosts(data.id, token);
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error loading profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async (userId: string, token: string) => {
    try {
      const response = await fetch(
        `${ENDPOINTS.POSTS}?userId=${userId}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Failed to load profile</p>
          <Button onClick={() => router.push("/home")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          {/* Profile Header Card */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20"></div>

            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row gap-6 md:items-end md:-mt-16">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                  <AvatarFallback className="text-2xl">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-muted-foreground mb-4">{user.bio}</p>

                  <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Joined recently
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {userPosts.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {user.followers.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Followers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {user.following.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Following
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="md:mb-0">
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Posts */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold px-4 md:px-0">Posts</h2>
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  postType={
                    (post.mediaType as
                      | "image"
                      | "video"
                      | "audio"
                      | "text") || "text"
                  }
                  authorName={`${post.author.firstName} ${post.author.lastName}`}
                  authorAvatar={post.author.avatarUrl}
                  date={new Date(post.id).toLocaleDateString()}
                  textContent={post.content}
                  mediaUrl={
                    post.imageUrl || post.videoUrl || post.audioUrl
                  }
                />
              ))
            ) : (
              <Card className="text-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
    </div>
  );
}