"use client";

import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, Heart, Share2, Music2, Plus,
  Bookmark, MoreHorizontal, Clapperboard, Users, Play, Pause,
  ChevronUp, ChevronDown, Check, Volume2, VolumeX
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";

const CURRENT_USER_ID = "d0db50a6-1281-4a19-837b-28ce9975ef82";

interface ApiPost {
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

interface ReelsResponse {
  reels: ApiPost[];
  total: number;
  page: number;
  totalPages: number;
}

interface VideoReel {
  id: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  audio: string;
  videoUrl: string;
  createdAt?: string;
  isLiked: boolean;
  isFollowed: boolean;
  isBookmarked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export default function VideoPage() {
  const [videoPosts, setVideoPosts] = useState<VideoReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data, error, isLoading: apiLoading } = useApi<ReelsResponse>(
    `${ENDPOINTS.REELS}?limit=30`
  );

  useEffect(() => {
    if (data?.reels) {
      const videos = data.reels.map(post => {
        const isLiked = post.likes?.some(like => like.userId === CURRENT_USER_ID) || false;
        return {
          id: post.id,
          author: `${post.author.firstName} ${post.author.lastName}`,
          authorId: post.author.id,
          authorAvatar: post.author.avatarUrl,
          description: post.content || "",
          likes: post.likes?.length || 0,
          comments: post.comments?.length || 0,
          shares: 0,
          audio: "Original Audio",
          videoUrl: post.videoUrl!,
          createdAt: post.createdAt,
          isLiked,
          isFollowed: false,
          isBookmarked: false,
          likeCount: post.likes?.length || 0,
          commentCount: post.comments?.length || 0,
          shareCount: 0,
        };
      });
      setVideoPosts(videos);
    }
  }, [data]);

  useEffect(() => {
    setIsLoading(apiLoading);
  }, [apiLoading]);

  useEffect(() => {
    if (error) {
      console.error("Error loading video posts:", error);
      toast.error("Failed to load videos");
    }
  }, [error]);

  const ReelsFeed = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
    const [iconStates, setIconStates] = useState<{ [key: string]: { show: boolean; type: 'play' | 'pause' | 'heart' } }>({});
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [mutedStates, setMutedStates] = useState<{ [key: string]: boolean }>({}); // per-video mute state
    const timeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
    const lastTapRef = useRef<{ [key: string]: number }>({}); // for double-tap detection

    useEffect(() => {
      return () => {
        Object.values(timeoutsRef.current).forEach(clearTimeout);
      };
    }, []);

    // Auto-play with sound (unmuted)
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target as HTMLVideoElement;
            const reelId = video.dataset.reelId;
            if (!reelId) return;

            if (entry.isIntersecting) {
              videoRefs.current.forEach((v, id) => {
                if (id !== reelId) v.pause();
              });
              // Play unmuted (browser may block; we'll let it try)
              video.play().catch(e => console.log('Auto-play failed:', e));
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.7 }
      );

      videoRefs.current.forEach((video) => observer.observe(video));
      return () => observer.disconnect();
    }, [videoPosts]);

    const showIcon = (reelId: string, type: 'play' | 'pause' | 'heart') => {
      if (timeoutsRef.current[reelId]) {
        clearTimeout(timeoutsRef.current[reelId]);
      }
      setIconStates(prev => ({ ...prev, [reelId]: { show: true, type } }));
      timeoutsRef.current[reelId] = setTimeout(() => {
        setIconStates(prev => ({ ...prev, [reelId]: { ...prev[reelId], show: false } }));
      }, 800);
    };

    const handleVideoClick = (reelId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const video = videoRefs.current.get(reelId);
      if (!video) return;

      const now = Date.now();
      const lastTap = lastTapRef.current[reelId] || 0;
      const isDoubleTap = now - lastTap < 300; // 300ms double tap threshold

      if (isDoubleTap) {
        // Double tap: like
        handleLike(reelId);
        showIcon(reelId, 'heart');
        lastTapRef.current[reelId] = 0; // reset to prevent triple tap
      } else {
        // Single tap: pause/play
        if (video.paused) {
          video.play().then(() => {
            showIcon(reelId, 'play');
          }).catch(e => console.log('Play failed:', e));
        } else {
          video.pause();
          showIcon(reelId, 'pause');
        }
        lastTapRef.current[reelId] = now;
      }

      setOpenMenuId(null);
    };

    const handleLike = (reelId: string) => {
      setVideoPosts(prev => prev.map(reel => {
        if (reel.id === reelId) {
          const newLiked = !reel.isLiked;
          return {
            ...reel,
            isLiked: newLiked,
            likeCount: newLiked ? reel.likeCount + 1 : reel.likeCount - 1,
          };
        }
        return reel;
      }));
    };

    const handleComment = (reelId: string) => {
      toast.info("Open comments modal (simulated)");
    };

    const handleShare = (reelId: string) => {
      navigator.clipboard.writeText(`${window.location.origin}/reel/${reelId}`);
      toast.success("Link copied to clipboard!");
    };

    const handleFollow = (reelId: string, authorId: string) => {
      setVideoPosts(prev => prev.map(reel => {
        if (reel.id === reelId) {
          return { ...reel, isFollowed: !reel.isFollowed };
        }
        return reel;
      }));
      setTimeout(() => toast.success("Follow toggled"), 300);
    };

    const handleBookmark = (reelId: string) => {
      setVideoPosts(prev => prev.map(reel => {
        if (reel.id === reelId) {
          return { ...reel, isBookmarked: !reel.isBookmarked };
        }
        return reel;
      }));
      setTimeout(() => toast.success("Bookmark updated"), 300);
    };

    const handleMoreOption = (option: string, reelId: string) => {
      toast.info(`${option} for reel ${reelId}`);
      setOpenMenuId(null);
    };

    const toggleMute = (reelId: string) => {
      const video = videoRefs.current.get(reelId);
      if (video) {
        video.muted = !video.muted;
        setMutedStates(prev => ({ ...prev, [reelId]: video.muted }));
      }
    };

    const scrollToReel = (direction: 'up' | 'down') => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const currentScroll = container.scrollTop;
      const reelHeight = container.clientHeight;
      const newScroll = direction === 'down' 
        ? currentScroll + reelHeight 
        : currentScroll - reelHeight;
      container.scrollTo({ top: newScroll, behavior: 'smooth' });
      setOpenMenuId(null);
    };

    useEffect(() => {
      const handleClickOutside = () => setOpenMenuId(null);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
      <div className="relative h-[calc(100vh-8rem)]">
        {/* Up/Down Navigation Arrows - positioned fixed on the right side of the page */}
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          <button
            onClick={() => scrollToReel('up')}
            className="p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full shadow-lg transition-all hover:scale-110 border border-white/20"
            aria-label="Previous reel"
          >
            <ChevronUp size={24} />
          </button>
          <button
            onClick={() => scrollToReel('down')}
            className="p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full shadow-lg transition-all hover:scale-110 border border-white/20"
            aria-label="Next reel"
          >
            <ChevronDown size={24} />
          </button>
        </div>

        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide rounded-2xl bg-black shadow-2xl relative"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : videoPosts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white">
              <p>No videos available</p>
            </div>
          ) : (
            videoPosts.map((reel) => (
              <div
                key={reel.id}
                className="h-full w-full snap-start relative bg-black flex flex-col justify-center items-center text-white"
                onClick={(e) => handleVideoClick(reel.id, e)}
              >
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(reel.id, el);
                      el.dataset.reelId = reel.id;
                      // Initialize muted state
                      if (mutedStates[reel.id] === undefined) {
                        el.muted = false; // start unmuted
                        setMutedStates(prev => ({ ...prev, [reel.id]: false }));
                      } else {
                        el.muted = mutedStates[reel.id];
                      }
                    } else {
                      videoRefs.current.delete(reel.id);
                    }
                  }}
                  src={reel.videoUrl}
                  className="absolute inset-0 w-full h-full object-contain"
                  loop
                  playsInline
                  preload="metadata"
                  controls={false}
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />

                {/* Play/Pause/Heart icon overlay */}
                {iconStates[reel.id]?.show && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                      {iconStates[reel.id].type === 'play' && <Play className="h-12 w-12 text-white fill-white" />}
                      {iconStates[reel.id].type === 'pause' && <Pause className="h-12 w-12 text-white fill-white" />}
                      {iconStates[reel.id].type === 'heart' && <Heart className="h-12 w-12 text-white fill-[#ff3b5c]" />}
                    </div>
                  </div>
                )}

                {/* Mute/Unmute Button - top right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute(reel.id);
                  }}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  {mutedStates[reel.id] ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                {/* Right Actions Overlay */}
                <div className="absolute right-3 bottom-10 flex flex-col gap-6 items-center z-10 pointer-events-auto">
                  {/* Avatar + Bookmark */}
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full border-[1.5px] border-white overflow-hidden shadow-lg relative">
                      <Avatar className="h-full w-full">
                        {reel.authorAvatar ? (
                          <AvatarImage src={reel.authorAvatar} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-white">
                          {reel.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(reel.id);
                      }}
                      className="bg-[#800517] rounded-full p-[2px] -mt-2.5 z-10 shadow-md border-2 border-black/80 hover:scale-110 transition-transform"
                      aria-label={reel.isBookmarked ? "Remove bookmark" : "Bookmark"}
                    >
                      {reel.isBookmarked ? (
                        <Check size={10} className="text-white" />
                      ) : (
                        <Plus size={10} className="text-white" />
                      )}
                    </button>
                  </div>

                  {/* Like */}
                  <div className="flex flex-col items-center group">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(reel.id);
                      }}
                      className="text-white hover:text-white/80 transition-all duration-300 active:scale-90 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    >
                      {reel.isLiked ? (
                        <Heart size={28} strokeWidth={2.5} fill="#ff3b5c" className="text-[#ff3b5c]" />
                      ) : (
                        <Heart size={28} strokeWidth={2.5} />
                      )}
                    </button>
                    <span className="text-[12px] font-semibold text-white drop-shadow-md mt-1">{reel.likeCount}</span>
                  </div>

                  {/* Comment */}
                  <div className="flex flex-col items-center group">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComment(reel.id);
                      }}
                      className="text-white hover:text-white/80 transition-all duration-300 active:scale-90 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    >
                      <MessageCircle size={28} strokeWidth={2.5} />
                    </button>
                    <span className="text-[12px] font-semibold text-white drop-shadow-md mt-1">{reel.commentCount}</span>
                  </div>

                  {/* Share */}
                  <div className="flex flex-col items-center group">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(reel.id);
                      }}
                      className="text-white hover:text-white/80 transition-all duration-300 active:scale-90 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    >
                      <Share2 size={28} strokeWidth={2.5} />
                    </button>
                    <span className="text-[12px] font-semibold text-white drop-shadow-md mt-1">{reel.shareCount}</span>
                  </div>

                  {/* Custom Dropdown Menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === reel.id ? null : reel.id);
                      }}
                      className="text-white hover:text-white/80 transition-all duration-300 active:scale-90 hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-2"
                    >
                      <MoreHorizontal size={26} strokeWidth={3} />
                    </button>

                    {openMenuId === reel.id && (
                      <div 
                        className="absolute right-0 bottom-full mb-2 w-48 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-30 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleMoreOption("Report", reel.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          Report
                        </button>
                        <button
                          onClick={() => handleMoreOption("Not interested", reel.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          Not interested
                        </button>
                        <button
                          onClick={() => handleMoreOption("Save to collection", reel.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          Save to collection
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rotating audio disc */}
                  <div className="h-8 w-8 rounded-md bg-white border-2 border-white/80 flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <img 
                      src={reel.authorAvatar || "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=100&h=100&fit=crop"} 
                      alt="audio cover" 
                      className="w-full h-full object-cover animate-spin" 
                      style={{ animationDuration: '4s' }} // slow spin
                    />
                  </div>
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute left-4 bottom-4 right-16 z-10 pointer-events-none flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-[15px] cursor-pointer pointer-events-auto drop-shadow-md hover:underline">
                      {reel.author}
                    </h3>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(reel.id, reel.authorId);
                      }}
                      className={`h-6 text-xs rounded-lg px-3 font-semibold pointer-events-auto transition-all duration-300 active:scale-95 drop-shadow-md ${
                        reel.isFollowed
                          ? "bg-white text-black hover:bg-white/90 border border-white"
                          : "bg-transparent hover:bg-white/10 text-white border border-white"
                      }`}
                    >
                      {reel.isFollowed ? "Following" : "Follow"}
                    </Button>
                  </div>
                  <p className="text-[14px] line-clamp-2 mb-3 text-white leading-relaxed max-w-sm drop-shadow-md font-medium">
                    {reel.description}
                  </p>
                  <div className="flex items-center gap-2 pointer-events-auto cursor-pointer drop-shadow-md">
                    <Music2 size={13} className="text-white" />
                    <div className="text-[13px] text-white font-medium truncate max-w-[200px]">
                      {reel.audio} • Original Audio
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <Header />
      <PageGrid
        left={null} // Left sidebar removed
        center={<ReelsFeed />}
        right={null}
      />
      <BottomNav />
    </div>
  );
}