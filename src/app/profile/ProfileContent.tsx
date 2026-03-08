"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Edit2, Upload, Plus, UserPlus, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/common/PostCard";
import { useApi } from "@/hooks/use-api";

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

export default function ProfileContent() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState({ bio: "" });
    const [uploading, setUploading] = useState(false);

    const params = useParams();
const userId = params?.id as string;

const profileEndpoint = userId
  ? ENDPOINTS.USER_DETAIL(userId)
  : ENDPOINTS.PROFILE;

const { data: userData, isLoading: userLoading, mutate: mutateUser } =
  useApi<UserProfile>(profileEndpoint);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!userData?.id || userData.id === localStorage.getItem("userId")) return;
            try {
                const token = localStorage.getItem("auth_token");
                const response = await fetch(ENDPOINTS.FOLLOW_STATUS(userData.id), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsFollowing(data.isFollowing);
                }
            } catch (error) {
                console.error("Failed to fetch follow status:", error);
            }
        };
        checkFollowStatus();
    }, [userData]);

    const handleFollowToggle = async () => {
        if (!userData?.id) return;
        const prev = isFollowing;
        setIsFollowing(!prev);
        try {
            const token = localStorage.getItem("auth_token");
            const method = prev ? "DELETE" : "POST";
            const response = await fetch(ENDPOINTS.FOLLOW(userData.id), {
                method,
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error();
            toast.success(prev ? "Unfollowed user" : "Following user");
            mutateUser(); // Refresh follower count
        } catch (error) {
            setIsFollowing(prev);
            toast.error("Failed to update follow status");
        }
    };

    const { data: postsData, isLoading: postsLoading } = useApi<{ posts: Post[] }>(
        userData?.id ? `${ENDPOINTS.POSTS}?userId=${userData.id}&limit=10` : null
    );

    useEffect(() => {
        if (userData) {
            setUser(userData);
            setIsOwnProfile(userData.id === localStorage.getItem("userId"));
        }
    }, [userData]);

    useEffect(() => {
        if (postsData) {
            setUserPosts(postsData.posts || []);
        }
    }, [postsData]);

    useEffect(() => {
        if (userLoading || postsLoading) {
            setIsLoading(true);
        } else {
            setIsLoading(false);
        }
    }, [userLoading, postsLoading]);

    useEffect(() => {
        if (user && isEditMode) {
            setEditData({ bio: user.bio || "" });
        }
    }, [isEditMode, user]);

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
            const response = await fetch(ENDPOINTS.ME, {
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

            const response = await fetch(ENDPOINTS.ME, {
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
        <div className="min-h-screen bg-white dark:bg-black pb-20 md:pb-0 transition-colors duration-300">
            <Header />

            <main className="pt-20 max-w-4xl mx-auto px-4 sm:px-6">
                {/* Profile Header Section - Instagram Style */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 py-4">
                    {/* Avatar (Left) */}
                    <div className="relative shrink-0">
                        <Avatar className="h-24 w-24 sm:h-36 sm:w-36 border-2 border-gray-100 dark:border-gray-800 shadow-sm ring-2 ring-transparent transition-all duration-300 hover:ring-primary/20">
                            {user?.avatarUrl ? (
                                <AvatarImage src={user.avatarUrl} alt={user.firstName} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="text-3xl sm:text-5xl font-light bg-gradient-to-tr from-primary/80 to-primary text-white">
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        {isOwnProfile && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-primary p-2 flex items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white dark:ring-black transition-transform duration-300 hover:scale-110 active:scale-95"
                            >
                                <Plus size={16} strokeWidth={3} />
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} className="hidden" />
                    </div>

                    {/* Info & Stats (Right) */}
                    <div className="flex-1 w-full text-center md:text-left flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 sm:gap-6 justify-center md:justify-start">
                            <h1 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-gray-100">
                                {user?.firstName} {user?.lastName} <span className="text-sm font-normal text-gray-500 block sm:inline">({user?.email})</span>
                            </h1>

                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <>
                                        <Button variant="secondary" onClick={() => setIsEditMode(true)} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold h-8 rounded-lg px-4 transition-all duration-300 active:scale-95">
                                            Edit profile
                                        </Button>
                                        <Button variant="secondary" className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold h-8 rounded-lg px-4 transition-all duration-300 active:scale-95">
                                            View archive
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleFollowToggle}
                                            className={cn(
                                                "h-8 rounded-lg px-6 font-semibold transition-all duration-300 active:scale-95 shadow-sm",
                                                isFollowing ? "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800" : "bg-primary text-white hover:bg-primary/90"
                                            )}
                                        >
                                            {isFollowing ? "Following" : "Follow"}
                                        </Button>
                                        <Button variant="secondary" className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold h-8 rounded-lg px-4 transition-all duration-300 active:scale-95">
                                            Message
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats - Horizontal */}
                        <div className="flex justify-center md:justify-start gap-8 sm:gap-10 py-2 sm:py-0 border-y sm:border-y-0 border-gray-100 dark:border-gray-800/50">
                            <div className="text-center sm:text-left">
                                <span className="font-bold text-gray-900 dark:text-gray-100 block sm:inline mr-1">{userPosts.length}</span>
                                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">posts</span>
                            </div>
                            <div className="text-center sm:text-left cursor-pointer transition-all duration-300 hover:opacity-70">
                                <span className="font-bold text-gray-900 dark:text-gray-100 block sm:inline mr-1">{user?.followers?.length || 0}</span>
                                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">followers</span>
                            </div>
                            <div className="text-center sm:text-left cursor-pointer transition-all duration-300 hover:opacity-70">
                                <span className="font-bold text-gray-900 dark:text-gray-100 block sm:inline mr-1">{user?.following?.length || 0}</span>
                                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">following</span>
                            </div>
                        </div>

                        {/* Bio segment */}
                        <div className="mt-2 text-sm text-gray-900 dark:text-gray-100 leading-relaxed text-center md:text-left max-w-sm">
                            {isEditMode ? (
                                <div className="space-y-3">
                                    <Textarea
                                        value={editData.bio}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                        className="bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-1 focus-visible:ring-primary resize-none min-h-[80px] text-center md:text-left"
                                        placeholder="Add a bio..."
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleSaveBio} className="flex-1 bg-primary text-white h-8 text-xs font-semibold" disabled={uploading}>Save</Button>
                                        <Button onClick={() => setIsEditMode(false)} variant="ghost" className="flex-1 h-8 text-xs font-semibold" disabled={uploading}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{user.bio || "No bio yet."}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Tabs */}
                <div className="border-t border-gray-200 dark:border-gray-800 flex justify-center -mt-[1px]">
                    <div className="flex gap-12 sm:gap-16">
                        {['POSTS', 'REELS', 'SAVED'].map((tab, i) => (
                            <button
                                key={tab}
                                className={cn(
                                    "py-4 text-xs font-bold tracking-widest transition-all duration-300 flex items-center gap-2 outline-none",
                                    i === 0
                                        ? "text-gray-900 dark:text-white border-t-2 border-gray-900 dark:border-white"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 border-t-2 border-transparent"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-3 gap-1 sm:gap-4 mt-1 sm:mt-4">
                    {userPosts.length > 0 ? (
                        userPosts.map((post) => (
                            <div key={post.id} className="aspect-square bg-gray-100 dark:bg-gray-900 relative group overflow-hidden cursor-pointer sm:rounded-sm">
                                {post.imageUrl ? (
                                    <img src={post.imageUrl} alt="post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : post.videoUrl ? (
                                    <video src={post.videoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-4">{post.content}</p>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 text-white font-bold">
                                    <div className="flex items-center gap-1.5 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                        <span>{post.likes?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
                                        <span>{post.comments?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 py-20 text-center flex flex-col items-center justify-center gap-4">
                            <div className="h-16 w-16 border-2 border-gray-900 dark:border-white rounded-full flex items-center justify-center">
                                <Plus size={32} />
                            </div>
                            <h2 className="text-3xl font-light text-gray-900 dark:text-white">Share Photos</h2>
                            <p className="text-sm font-medium text-gray-500">When you share photos, they will appear on your profile.</p>
                            {isOwnProfile && <span className="text-primary font-bold text-sm cursor-pointer hover:underline">Share your first photo</span>}
                        </div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
