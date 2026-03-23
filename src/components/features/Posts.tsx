"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileVideo2, AudioLines, Text as TextIcon } from "lucide-react";
import { PostCard } from "@/components/common/PostCard";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
// import { StoriesStrip } from "./StoriesStrip";

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
  isSaved?: boolean;
  isReel?: boolean;
}

export function Posts({ onDataLoaded }: { onDataLoaded?: () => void }) {
  const [activeTab, setActiveTab] = useState("All");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data, error, isLoading: apiLoading, mutate } = useApi<{ posts: Post[] }>(`${ENDPOINTS.POSTS_URL}?limit=20`);

  useEffect(() => {
    if (data) {
      console.log(data, "getPostdatas")
      setPosts(data.posts || []);
      if (onDataLoaded) onDataLoaded();
    }
  }, [data, onDataLoaded]);

  useEffect(() => {
    setIsLoading(apiLoading);
  }, [apiLoading]);

  useEffect(() => {
    if (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    }
  }, [error]);

  const fetchPosts = async () => {
    await mutate();
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
    <div className="flex justify-center w-full md:px-0 scroll-smooth">
      <div className="w-full max-w-[500px] md:max-w-[600px] lg:max-w-[650px]">
        {/* User requested removal of story section */}
        <div className="flex justify-center sticky top-[60px] md:top-[80px] z-40 bg-[#FBFDFF]/80 dark:bg-black/80 backdrop-blur-md py-3 px-4 md:mx-0 md:px-0 border-b border-gray-100 dark:border-gray-800/50 transition-all duration-300">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1 w-full justify-start md:justify-center">
            <Badge
              variant={activeTab === "All" ? "default" : "secondary"}
              className={`rounded-full px-5 py-2 cursor-pointer transition-all duration-300 whitespace-nowrap active:scale-95 ${activeTab === "All" ? "shadow-md bg-primary hover:bg-primary/90" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
              onClick={() => setActiveTab("All")}
            >
              All
            </Badge>
            <Badge
              variant={activeTab === "Video" ? "default" : "secondary"}
              className={`rounded-full px-5 py-2 cursor-pointer transition-all duration-300 flex gap-2 items-center whitespace-nowrap active:scale-95 ${activeTab === "Video" ? "shadow-md bg-primary hover:bg-primary/90" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
              onClick={() => setActiveTab("Video")}
            >
              <FileVideo2 className="h-4 w-4" />
              Video
            </Badge>
            <Badge
              variant={activeTab === "Audio" ? "default" : "secondary"}
              className={`rounded-full px-5 py-2 cursor-pointer transition-all duration-300 flex gap-2 items-center whitespace-nowrap active:scale-95 ${activeTab === "Audio" ? "shadow-md bg-primary hover:bg-primary/90" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
              onClick={() => setActiveTab("Audio")}
            >
              <AudioLines className="h-4 w-4" />
              Audio
            </Badge>
            <Badge
              variant={activeTab === "Text" ? "default" : "secondary"}
              className={`rounded-full px-5 py-2 cursor-pointer transition-all duration-300 flex gap-2 items-center whitespace-nowrap active:scale-95 ${activeTab === "Text" ? "shadow-md bg-primary hover:bg-primary/90" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
              onClick={() => setActiveTab("Text")}
            >
              <TextIcon className="h-4 w-4" />
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
                    isSaved={post.isSaved}
                    isLiked={userHasLiked}
                    isReel={post.isReel}
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