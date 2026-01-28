"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileVideo2, AudioLines, Text as TextIcon } from "lucide-react";
import { PostCard } from "@/components/common/PostCard"
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";

interface Post {
  id: string;
  content: string;
  mediaType?: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  likes?: any[];
  comments?: any[];
  createdAt?: string;
}

export function Posts({ onDataLoaded }: { onDataLoaded?: () => void }) {
  const [activeTab, setActiveTab] = useState("All");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  // Update fetchPosts with error handling

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${ENDPOINTS.POSTS}?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          window.location.href = "/auth/login";
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setPosts((data?.posts as any[]) || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
      if (onDataLoaded) {
        onDataLoaded();
      }
    }
  };

  const getPostType = (post: Post): 'image' | 'video' | 'audio' | 'text' => {
    if (post.videoUrl) return 'video';
    if (post.audioUrl) return 'audio';
    if (post.imageUrl) return 'image';
    return 'text';
  };

  const filteredPosts = posts.filter((post) => {
    const postType = getPostType(post);
    if (activeTab === "All") return true;
    if (activeTab === "Video") return postType === "video";
    if (activeTab === "Audio") return postType === "audio";
    if (activeTab === "Text") return postType === "text";
    return true;
  });

  return (
    <div className="flex justify-center w-full px-4 md:px-0">
      <div className="w-full max-w-[500px]">
        <div className="flex justify-center sticky top-20 z-40 bg-[#FBFDFF]/80 backdrop-blur-sm py-3 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1">
            <Badge
              variant={activeTab === "All" ? "default" : "secondary"}
              className="rounded-[5px] px-4 py-1.5 cursor-pointer transition-all whitespace-nowrap"
              onClick={() => setActiveTab("All")}
            >
              All
            </Badge>
            <Badge
              variant={activeTab === "Video" ? "default" : "secondary"}
              className="rounded-[5px] px-4 py-1.5 cursor-pointer transition-all flex gap-1.5 items-center whitespace-nowrap"
              onClick={() => setActiveTab("Video")}
            >
              <FileVideo2 className="h-3.5 w-3.5" />
              Video
            </Badge>
            <Badge
              variant={activeTab === "Audio" ? "default" : "secondary"}
              className="rounded-[5px] px-4 py-1.5 cursor-pointer transition-all flex gap-1.5 items-center whitespace-nowrap"
              onClick={() => setActiveTab("Audio")}
            >
              <AudioLines className="h-3.5 w-3.5" />
              Audio
            </Badge>
            <Badge
              variant={activeTab === "Text" ? "default" : "secondary"}
              className="rounded-[5px] px-4 py-1.5 cursor-pointer transition-all flex gap-1.5 items-center whitespace-nowrap"
              onClick={() => setActiveTab("Text")}
            >
              <TextIcon className="h-3.5 w-3.5" />
              Text
            </Badge>
          </div>
        </div>
        <div className="mt-5">
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => {
                const postType = getPostType(post);
                const userId = localStorage.getItem("userId");
                const userHasLiked = post.likes?.some((like: any) => like.userId === userId || like.id === userId) || false;
                
                return (
                  <PostCard
                    key={post.id}
                    postId={post.id}
                    postType={postType}
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
              <div className="text-center py-12 text-muted-foreground">
                <p>No posts yet. Be the first to share!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}