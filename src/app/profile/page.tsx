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
  }, [router]); // Add router dependency

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
    <div className="min-h-screen bg-[#F0F2F5] pb-20 md:pb-0">
      <Header />

      <main className="pt-14">
        {/* Profile Header Section - Facebook Style */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-[1095px] mx-auto">
            {/* Cover Photo */}
            <div className="relative h-[200px] md:h-[350px] w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-b-xl overflow-hidden group">
              {/* Optional: Add cover photo image here if available */}
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {isOwnProfile && (
                <button className="absolute bottom-4 right-4 bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all">
                  <Upload size={18} />
                  <span>Add cover photo</span>
                </button>
              )}
            </div>

            {/* Profile Info Area */}
            <div className="px-4 pb-4">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-12 md:-mt-8 mb-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-40 w-40 border-4 border-white shadow-xl ring-1 ring-black/5">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                    ) : null}
                    <AvatarFallback className="text-5xl font-bold bg-[#800517] text-white">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-slate-100 p-2 rounded-full hover:bg-slate-200 shadow-md ring-2 ring-white transition-transform hover:scale-110"
                    >
                      <Upload size={20} className="text-slate-700" />
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} className="hidden" />
                </div>

                {/* Name and Stats */}
                <div className="flex-1 text-center md:text-left pb-2">
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-slate-500 font-semibold mb-2">{user?.followers?.length || 0} followers • {user?.following?.length || 0} following</p>

                  {/* Follower Avatars (Dummy) */}
                  <div className="flex justify-center md:justify-start -space-x-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Avatar key={i} className="h-8 w-8 border-2 border-white">
                        <AvatarFallback className="text-[10px] bg-slate-200 text-slate-600">F</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pb-2">
                  {isOwnProfile ? (
                    <>
                      <Button className="bg-[#800517] hover:bg-[#A0061D] text-white font-bold px-6 shadow-sm">
                        <Plus className="h-4 w-4 mr-2" /> Add to Story
                      </Button>
                      <Button variant="secondary" onClick={() => setIsEditMode(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold shadow-sm">
                        <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="bg-primary text-white font-bold shadow-sm">
                        <UserPlus className="h-4 w-4 mr-2" /> Follow
                      </Button>
                      <Button variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold shadow-sm">
                        <Mail className="h-4 w-4 mr-2" /> Message
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Profile Divider */}
              <div className="border-t"></div>

              {/* Profile Tabs (Dummy UI) */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                {['Posts', 'About', 'Friends', 'Photos', 'Videos', 'Reels'].map((tab, i) => (
                  <button key={tab} className={`px-4 py-3 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${i === 0 ? "text-[#800517] border-b-4 border-[#800517] rounded-none" : "text-slate-500 hover:bg-slate-100"}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[1095px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[40%_60%] gap-4">

          {/* Left Column: Intro & Info */}
          <div className="space-y-4">
            <Card className="shadow-sm border-none bg-white p-4">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Intro</h3>
              <div className="space-y-4">
                {isEditMode ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#800517] resize-none min-h-[100px] text-center"
                      placeholder="Describe who you are..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveBio} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold" disabled={uploading}>Save</Button>
                      <Button onClick={() => setIsEditMode(false)} variant="ghost" className="flex-1 font-bold" disabled={uploading}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-center text-slate-900 font-medium">{user.bio || "No bio yet."}</p>
                    {isOwnProfile && (
                      <Button onClick={() => setIsEditMode(true)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold border-none">
                        Edit bio
                      </Button>
                    )}
                  </>
                )}

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-slate-800">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <span className="text-sm">Email: <span className="font-bold">{user.email}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-800">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <span className="text-sm">Joined <span className="font-bold">January 2024</span></span>
                  </div>
                </div>

                {isOwnProfile && (
                  <Button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold border-none">
                    Edit details
                  </Button>
                )}
              </div>
            </Card>

            <Card className="shadow-sm border-none bg-white p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">Photos</h3>
                <button className="text-[#800517] hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium">See all photos</button>
              </div>
              <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-slate-100 animate-pulse rounded-md"></div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Posts */}
          <div className="space-y-4">
            {/* Create Post Card (Dummy) */}
            {isOwnProfile && (
              <Card className="shadow-sm border-none bg-white p-4">
                <div className="flex gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.firstName[0]}</AvatarFallback>
                  </Avatar>
                  <button className="flex-1 bg-slate-100 hover:bg-slate-200 rounded-full text-left px-4 text-slate-500 text-sm">
                    What's on your mind, {user.firstName}?
                  </button>
                </div>
                <div className="flex border-t pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-bold text-sm">
                    <Upload size={20} className="text-red-500" /> Live Video
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-bold text-sm">
                    <Upload size={20} className="text-green-500" /> Photo/video
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-bold text-sm">
                    <Upload size={20} className="text-yellow-500" /> Life Event
                  </button>
                </div>
              </Card>
            )}

            {/* Posts Header */}
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xl font-bold text-slate-900">Posts</h3>
              <div className="flex gap-2">
                <Button variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold shadow-sm">
                  Filters
                </Button>
                <Button variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold shadow-sm">
                  Manage posts
                </Button>
              </div>
            </div>

            {/* Actual Posts */}
            <div className="space-y-4">
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

      </main>

      <BottomNav />
    </div>
  );
}