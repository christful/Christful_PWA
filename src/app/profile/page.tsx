"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Mail, MapPin, Link as LinkIcon, Calendar, UserPlus, UserCheck, Edit2, X, Upload } from "lucide-react";
import { PostCard } from "@/components/common/PostCard";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  followers?: any[];
  following?: any[];
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
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({ bio: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user && isEditMode) {
      setEditData({ bio: user.bio || "" });
    }
  }, [isEditMode]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const userId = localStorage.getItem("userId");
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
        setIsOwnProfile(data.id === userId);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("avatar", file);

      // Try uploading with PATCH to PROFILE endpoint
      const response = await fetch(ENDPOINTS.PROFILE, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem("userAvatar", updatedUser.avatarUrl || updatedUser.avatar);
        toast.success("Avatar updated successfully");
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.message || "Failed to update avatar");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveBio = async () => {
    try {
      setUploading(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(ENDPOINTS.PROFILE, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: editData.bio }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditMode(false);
        toast.success("Bio updated successfully");
      } else {
        toast.error("Failed to update bio");
      }
    } catch (error) {
      console.error("Error updating bio:", error);
      toast.error("Failed to update bio");
    } finally {
      setUploading(false);
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
              <div className="flex flex-col md:flex-row gap-8 md:-mt-16">
                {/* Avatar with Upload Button */}
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <Avatar className="h-40 w-40 border-4 border-white shadow-lg">
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                      ) : null}
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/70 text-white">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 bg-primary text-white p-3 rounded-full hover:bg-primary/90 disabled:opacity-50 shadow-lg transition-all hover:scale-110"
                        title="Upload avatar"
                      >
                        <Upload className="h-5 w-5" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* User Info */}
                {isEditMode ? (
                  // Edit Mode
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold mb-6">
                      {user?.firstName} {user?.lastName}
                    </h1>
                    
                    <div className="mb-6">
                      <label className="text-sm font-medium mb-2 block">Bio</label>
                      <Textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        className="min-h-24 resize-none"
                        disabled={uploading}
                      />
                      <p className="text-xs text-muted-foreground mt-2">{editData.bio.length}/500 characters</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveBio}
                        disabled={uploading}
                        className="flex-1"
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditMode(false)}
                        disabled={uploading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                      <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                          {user?.firstName} {user?.lastName}
                        </h1>
                        {user?.bio && <p className="text-muted-foreground text-lg leading-relaxed">{user.bio}</p>}
                      </div>
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditMode(true)}
                          className="self-start md:self-start text-primary hover:bg-gray-100 p-2 rounded-full transition-colors"
                          title="Edit profile"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 mb-8 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user?.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Member
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {userPosts.length}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Posts</div>
                      </div>
                      <div className="text-center border-l border-r border-gray-200">
                        <div className="text-3xl font-bold text-primary">
                          {user?.followers?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {user?.following?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Following</div>
                      </div>
                    </div>
                  </div>
                )}

                {!isOwnProfile && (
                  <Button className="md:mb-0">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Posts */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold px-4 md:px-0">Posts</h2>
            {userPosts.length > 0 ? (
              userPosts.map((post) => {
                const getPostType = (post: Post): 'image' | 'video' | 'audio' | 'text' => {
                  if (post.videoUrl) return 'video';
                  if (post.audioUrl) return 'audio';
                  if (post.imageUrl) return 'image';
                  return 'text';
                };
                const userId = localStorage.getItem("userId");
                const userHasLiked = post.likes?.some((like: any) => like.userId === userId || like.id === userId) || false;
                
                return (
                  <PostCard
                    key={post.id}
                    postId={post.id}
                    postType={getPostType(post)}
                    authorId={post.author.id}
                    authorName={`${post.author.firstName} ${post.author.lastName}`}
                    authorAvatar={post.author.avatarUrl || ''}
                    date={post.createdAt ? new Date(post.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    textContent={post.content}
                    imageUrl={post.imageUrl}
                    videoUrl={post.videoUrl}
                    audioUrl={post.audioUrl}
                    likesCount={post.likes?.length || 0}
                    commentsCount={post.comments?.length || 0}
                    isLiked={userHasLiked}
                  />
                );
              })
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