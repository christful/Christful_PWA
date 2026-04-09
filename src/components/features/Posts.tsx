"use client";
import { useState, useEffect, useMemo } from "react";
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

type FeedItem = Post & {
  isReel?: boolean;
};

interface ReelsResponse {
  reels: Post[];
  total?: number;
  page?: number;
  totalPages?: number;
}

export function Posts({ onDataLoaded }: { onDataLoaded?: () => void }) {
  const [activeTab, setActiveTab] = useState("All");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    data: postsData,
    error: postsError,
    isLoading: postsLoading,
  } = useApi<{ posts: Post[] }>(`${ENDPOINTS.POSTS_URL}?limit=20`);

  const {
    data: reelsData,
    error: reelsError,
    isLoading: reelsLoading,
  } = useApi<ReelsResponse>(`${ENDPOINTS.REELS}?limit=20`);

  useEffect(() => {
    const postItems: FeedItem[] = (postsData?.posts || []).map((post) => ({
      ...post,
      isReel: false,
    }));

    const reelItems: FeedItem[] = (reelsData?.reels || []).map((reel) => ({
      ...reel,
      isReel: true,
    }));

    const combinedFeed = mergeFeedItems(postItems, reelItems);
    setFeedItems(combinedFeed);

    if ((postsData?.posts?.length || reelItems.length) && onDataLoaded) {
      onDataLoaded();
    }
  }, [postsData, reelsData, onDataLoaded]);

  useEffect(() => {
    setIsLoading(postsLoading || reelsLoading);
  }, [postsLoading, reelsLoading]);

  useEffect(() => {
    if (postsError || reelsError) {
      console.error("Error loading feed:", postsError || reelsError);
      toast.error("Failed to load feed. Please refresh.");
    }
  }, [postsError, reelsError]);

  const mergeFeedItems = (posts: FeedItem[], reels: FeedItem[]) => {
    const sortedPosts = [...posts].sort((a, b) => {
      return (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0);
    });
    const sortedReels = [...reels].sort((a, b) => {
      return (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0);
    });

    const merged: FeedItem[] = [];
    const postsQueue = [...sortedPosts];
    const reelsQueue = [...sortedReels];

    while (postsQueue.length || reelsQueue.length) {
      const nextPosts = postsQueue.splice(0, 4);
      merged.push(...nextPosts);
      if (reelsQueue.length) {
        merged.push(reelsQueue.shift()!);
      }
    }

    if (!merged.length && reels.length) {
      merged.push(...reels);
    }

    return merged;
  };

  const getPostType = (post: FeedItem): 'image' | 'video' | 'audio' | 'text' => {
    if (post.videoUrl) return 'video';
    if (post.audioUrl) return 'audio';
    if (post.imageUrl) return 'image';
    return 'text';
  };

  const filteredItems = useMemo(() => {
    return feedItems.filter((post) => {
      const postType = getPostType(post);
      if (activeTab === "Video" && postType !== "video") return false;
      if (activeTab === "Audio" && postType !== "audio") return false;
      if (activeTab === "Text" && postType !== "text") return false;
      return true;
    });
  }, [feedItems, activeTab]);

  return (
    <div className="flex justify-center w-full md:px-0 scroll-smooth">
      <div className="w-full max-w-[500px] md:max-w-[600px] lg:max-w-[650px]">
        <div className="sticky top-[60px] md:top-[80px] z-40 bg-[#FBFDFF]/90 dark:bg-black/90 backdrop-blur-md py-4 px-4 md:px-0 border-b border-gray-100 dark:border-gray-800/50 transition-all duration-300">
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
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item: any, index: number) => {
                const postType = getPostType(item);
                const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
                const userHasLiked = item.likes?.some((like: any) => like.userId === userId || like.id === userId) || false;

                return (
                  <PostCard
                    key={`${item.id}-${item.isReel ? "reel" : "post"}`}
                    postId={item.id}
                    postType={postType}
                    authorId={item.author.id}
                    authorName={`${item.author.firstName} ${item.author.lastName}`}
                    authorAvatar={item.author.avatarUrl || ''}
                    date={item.createdAt ? new Date(item.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    textContent={item.content}
                    imageUrl={item.imageUrl}
                    videoUrl={item.videoUrl}
                    audioUrl={item.audioUrl}
                    likesCount={item.likes?.length || 0}
                    commentsCount={item.comments?.length || 0}
                    isSaved={item.isSaved}
                    isLiked={userHasLiked}
                    isReel={item.isReel}
                  />
                );
              })
            ) : (
              <div className="text-center py-14 text-muted-foreground">
                <p className="text-base font-medium">No posts or reels found.</p>
                <p className="text-sm text-gray-500 mt-2">Try another search term or refresh the feed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}