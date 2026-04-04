"use client";

import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, Heart, Share2, Music2,
  Play, Pause,
  ChevronUp, ChevronDown, Volume2, VolumeX, X
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";

// Inline useMediaQuery hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);

    // Sync once at mount in case the query was changed
    onChange();

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

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

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
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
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

// Comment interfaces
interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  likesCount: number;
  isLiked: boolean;
  repliesCount?: number;
}

// Comments Panel for Desktop
const CommentsPanel = ({ 
  reelId, 
  onClose,
  currentUserId 
}: { 
  reelId: string; 
  onClose: () => void;
  currentUserId: string;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error } = useApi<any> (
    `${ENDPOINTS.REEL_COMMENTS(reelId)}?page=1&limit=50`
  );

  useEffect(() => {
    if (data) {
      const fetchedComments = data.comments ? data.comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: {
          id: c.author.id,
          firstName: c.author.firstName,
          lastName: c.author.lastName,
          avatarUrl: c.author.avatarUrl
        },
        likesCount: c.likes?.length || 0,
        isLiked: c.likes?.some((like: any) => like.userId === currentUserId) || false,
        repliesCount: c.replies?.length || 0
      })) : [];
      setComments(fetchedComments);
      setIsLoading(false);
    }
  }, [data, currentUserId]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load comments");
      setIsLoading(false);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(ENDPOINTS.REEL_COMMENTS(reelId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          ...(replyingToCommentId ? { parentCommentId: replyingToCommentId } : {}),
        }),
      });
      if (!response.ok) throw new Error('Failed to post comment');
      const newCommentData = await response.json();
      
      const comment: Comment = {
        id: newCommentData.id,
        content: newComment,
        createdAt: new Date().toISOString(),
        author: {
          id: currentUserId,
          firstName: "You",
          lastName: "",
          avatarUrl: undefined
        },
        likesCount: 0,
        isLiked: false,
        repliesCount: 0
      };
      setComments([comment, ...comments]);
      setNewComment("");
      toast.success("Comment added");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, isLiked: !isLiked, likesCount: isLiked ? c.likesCount - 1 : c.likesCount + 1 }
        : c
    ));
    try {
      await fetch(ENDPOINTS.LIKE_COMMENT(commentId), { method: 'POST' });
    } catch {
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, isLiked, likesCount: isLiked ? c.likesCount + 1 : c.likesCount - 1 }
          : c
      ));
      toast.error("Failed to like comment");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-bold text-lg">Comments</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800517]"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                {comment.author.avatarUrl ? (
                  <AvatarImage src={comment.author.avatarUrl} />
                ) : (
                  <AvatarFallback>{comment.author.firstName.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleLikeComment(comment.id, comment.isLiked)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <Heart size={14} className={comment.isLiked ? "fill-[#ff3b5c] text-[#ff3b5c]" : ""} />
                    {comment.likesCount}
                  </button>
                  <button
                    onClick={() => setReplyingToCommentId(prev => prev === comment.id ? null : comment.id)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {replyingToCommentId === comment.id ? "Cancel" : "Reply"}
                  </button>
                </div>
              </div>
        {replyingToCommentId && (
          <div className="mb-2 px-2 py-1 text-xs bg-slate-100 rounded-md text-slate-700">
            Replying to comment {replyingToCommentId}. <button type="button" onClick={() => setReplyingToCommentId(null)} className="underline">Cancel</button>
          </div>
        )}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#800517]"
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            size="sm" 
            className="bg-[#800517] hover:bg-[#600315] text-white rounded-full px-4"
            disabled={isSubmitting || !newComment.trim()}
          >
            Post
          </Button>
        </div>
      </form>
    </div>
  );
};

// Comments Modal for Mobile
const CommentsModal = ({ 
  reelId, 
  isOpen, 
  onClose,
  currentUserId 
}: { 
  reelId: string; 
  isOpen: boolean; 
  onClose: () => void;
  currentUserId: string;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error } = useApi<any>(
    isOpen ? ENDPOINTS.POST_COMMENTS(reelId) : null
  );

  useEffect(() => {
    if (data) {
      const fetchedComments = data.comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: {
          id: c.author.id,
          firstName: c.author.firstName,
          lastName: c.author.lastName,
          avatarUrl: c.author.avatarUrl
        },
        likesCount: c.likes?.length || 0,
        isLiked: c.likes?.some((like: any) => like.userId === currentUserId) || false,
        repliesCount: c.replies?.length || 0
      }));
      setComments(fetchedComments);
      setIsLoading(false);
    }
  }, [data, currentUserId]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load comments");
      setIsLoading(false);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(ENDPOINTS.POST_COMMENTS(reelId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (!response.ok) throw new Error('Failed to post comment');
      const newCommentData = await response.json();
      const comment: Comment = {
        id: newCommentData.id,
        content: newComment,
        createdAt: new Date().toISOString(),
        author: {
          id: currentUserId,
          firstName: "You",
          lastName: "",
          avatarUrl: undefined
        },
        likesCount: 0,
        isLiked: false,
        repliesCount: 0
      };
      setComments([comment, ...comments]);
      setNewComment("");
      toast.success("Comment added");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, isLiked: !isLiked, likesCount: isLiked ? c.likesCount - 1 : c.likesCount + 1 }
        : c
    ));
    try {
      await fetch(ENDPOINTS.LIKE_COMMENT(commentId), { method: 'POST' });
    } catch {
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, isLiked, likesCount: isLiked ? c.likesCount + 1 : c.likesCount - 1 }
          : c
      ));
      toast.error("Failed to like comment");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Comments</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800517]"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {comment.author.avatarUrl ? (
                    <AvatarImage src={comment.author.avatarUrl} />
                  ) : (
                    <AvatarFallback>{comment.author.firstName.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm">
                      {comment.author.firstName} {comment.author.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLikeComment(comment.id, comment.isLiked)}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <Heart size={14} className={comment.isLiked ? "fill-[#ff3b5c] text-[#ff3b5c]" : ""} />
                      {comment.likesCount}
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#800517]"
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              size="sm" 
              className="bg-[#800517] hover:bg-[#600315] text-white rounded-full px-4"
              disabled={isSubmitting || !newComment.trim()}
            >
              Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ReelsFeed component – memoized to prevent remounting
const ReelsFeed = memo(({ 
  videoPosts, 
  isLoading, 
  currentUser,
  selectedCommentReelId,
  setSelectedCommentReelId,
  handleLike,
  handleFollowToggle,
  handleShare,
}: {
  videoPosts: VideoReel[];
  isLoading: boolean;
  currentUser: CurrentUser | null | undefined;
  selectedCommentReelId: string | null;
  setSelectedCommentReelId: (id: string | null) => void;
  handleLike: (reelId: string) => void;
  handleFollowToggle: (reelId: string, authorId: string, currentlyFollowed: boolean) => void;
  handleShare: (reelId: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [iconStates, setIconStates] = useState<{ [key: string]: { show: boolean; type: 'play' | 'pause' | 'heart' } }>({});
  const [mutedStates, setMutedStates] = useState<{ [key: string]: boolean }>({});
  const timeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const lastTapRef = useRef<{ [key: string]: number }>({});
  const lsDesktop = useMediaQuery("(min-width: 768px)");
  const router = useRouter();

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // Auto-play with sound
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
    if (timeoutsRef.current[reelId]) clearTimeout(timeoutsRef.current[reelId]);
    setIconStates(prev => ({ ...prev, [reelId]: { show: true, type } }));
    timeoutsRef.current[reelId] = setTimeout(() => {
      setIconStates(prev => ({ ...prev, [reelId]: { ...prev[reelId], show: false } }));
    }, 800);
  };

  const handleVideoClick = (reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const lastTap = lastTapRef.current[reelId] || 0;
    const isDoubleTap = now - lastTap < 300;

    const video = videoRefs.current.get(reelId);
    if (!video) return;

    if (isDoubleTap) {
      handleLike(reelId);
      showIcon(reelId, 'heart');
      lastTapRef.current[reelId] = 0;
    } else {
      if (video.paused) {
        video.play().then(() => showIcon(reelId, 'play')).catch(console.log);
      } else {
        video.pause();
        showIcon(reelId, 'pause');
      }
      lastTapRef.current[reelId] = now;
    }
  };

  const handleComment = (reelId: string) => {
    setSelectedCommentReelId(reelId);
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
    const newScroll = direction === 'down' ? currentScroll + reelHeight : currentScroll - reelHeight;
    container.scrollTo({ top: newScroll, behavior: 'smooth' });
  };

  const reelContainerHeight = lsDesktop ? "h-[calc(100vh-5rem)]" : "h-[calc(100vh-5rem)]";

  return (
    <div className={`relative ${reelContainerHeight}`}>
      {/* Up/Down Navigation Arrows */}
      <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-3">
        <button
          onClick={() => scrollToReel('up')}
          className="p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full shadow-lg transition-all hover:scale-110 border border-white/20"
        >
          <ChevronUp size={24} />
        </button>
        <button
          onClick={() => scrollToReel('down')}
          className="p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full shadow-lg transition-all hover:scale-110 border border-white/20"
        >
          <ChevronDown size={24} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black relative"
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
              className="relative h-full w-full snap-start overflow-hidden bg-black"
              onClick={(e) => handleVideoClick(reel.id, e)}
            >
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(reel.id, el);
                    el.dataset.reelId = reel.id;
                    if (mutedStates[reel.id] === undefined) {
                      el.muted = false;
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

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {iconStates[reel.id]?.show && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                    {iconStates[reel.id].type === 'play' && <Play className="h-12 w-12 text-white fill-white" />}
                    {iconStates[reel.id].type === 'pause' && <Pause className="h-12 w-12 text-white fill-white" />}
                    {iconStates[reel.id].type === 'heart' && <Heart className="h-12 w-12 text-white fill-[#ff3b5c]" />}
                  </div>
                </div>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(reel.id); }}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                {mutedStates[reel.id] ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <div className="absolute right-3 bottom-10 flex flex-col gap-6 items-center z-10 pointer-events-auto">
                {/* Avatar - Clickable to view profile */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/profile/${reel.authorId}`);
                  }}
                  className="h-10 w-10 rounded-full border-[1.5px] border-white overflow-hidden shadow-lg relative hover:opacity-80 transition-opacity"
                  aria-label="View profile"
                >
                  <Avatar className="h-full w-full">
                    {reel.authorAvatar ? <AvatarImage src={reel.authorAvatar} /> : null}
                    <AvatarFallback className="bg-primary text-white">
                      {reel.author.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {/* Like */}
                <div className="flex flex-col items-center group">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLike(reel.id); }}
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
                    onClick={(e) => { e.stopPropagation(); handleComment(reel.id); }}
                    className="text-white hover:text-white/80 transition-all duration-300 active:scale-90 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  >
                    <MessageCircle size={28} strokeWidth={2.5} />
                  </button>
                  <span className="text-[12px] font-semibold text-white drop-shadow-md mt-1">{reel.commentCount}</span>
                </div>

                {/* Share */}
                <div className="flex flex-col items-center group">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(reel.id); }}
                    className="text-white hover:text-white/80 transition-all duration-300 active:scale-90 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  >
                    <Share2 size={28} strokeWidth={2.5} />
                  </button>
                  <span className="text-[12px] font-semibold text-white drop-shadow-md mt-1">{reel.shareCount}</span>
                </div>

                {/* Rotating audio disc */}
                <div className="h-8 w-8 rounded-md bg-white border-2 border-white/80 flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                  <img
                    src={reel.authorAvatar || "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=100&h=100&fit=crop"}
                    alt="audio cover"
                    className="w-full h-full object-cover animate-spin"
                    style={{ animationDuration: '4s' }}
                  />
                </div>
              </div>

              <div className="absolute left-4 bottom-4 right-16 z-10 pointer-events-none flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-[15px] cursor-pointer pointer-events-auto drop-shadow-md hover:underline">
                    {reel.author}
                  </h3>
                  {reel.isFollowed && (
                    <Button
                      size="sm"
                      disabled
                      className="h-6 text-xs rounded-lg px-3 font-semibold pointer-events-auto opacity-70 cursor-not-allowed bg-white text-black border border-white"
                    >
                      Following
                    </Button>
                  )}
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

      {/* Mobile Comments Modal */}
      {!lsDesktop && selectedCommentReelId && currentUser && (
        <CommentsModal
          reelId={selectedCommentReelId}
          isOpen={!!selectedCommentReelId}
          onClose={() => setSelectedCommentReelId(null)}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
});

ReelsFeed.displayName = 'ReelsFeed';

export default function VideoPage() {
  const [videoPosts, setVideoPosts] = useState<VideoReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommentReelId, setSelectedCommentReelId] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Fetch current user
  const { data: currentUser, isLoading: userLoading, error: userError } = useApi<CurrentUser>(
    ENDPOINTS.USER
  );

  // Fetch reels
  const { data, error, isLoading: apiLoading } = useApi<ReelsResponse>(
    `${ENDPOINTS.REELS}?limit=30`
  );

  useEffect(() => {
    if (userError) toast.error("Failed to load user data");
    if (error) toast.error("Failed to load videos");
  }, [userError, error]);

  useEffect(() => {
    setIsLoading(apiLoading || userLoading);
  }, [apiLoading, userLoading]);

  // Transform reels and fetch follow statuses
  useEffect(() => {
    if (data?.reels && currentUser) {
      const initialVideos = data.reels.map(post => {
        const isLiked = post.likes?.some(like => like.userId === currentUser.id) || false;
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
          isFollowed: false, // will be updated
          likeCount: post.likes?.length || 0,
          commentCount: post.comments?.length || 0,
          shareCount: 0,
        };
      });

      setVideoPosts(initialVideos);

      // Fetch follow status for each unique author
      const uniqueAuthorIds = [...new Set(initialVideos.map(v => v.authorId))];
      Promise.all(
        uniqueAuthorIds.map(async (authorId) => {
          try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(ENDPOINTS.FOLLOW_STATUS?.(authorId) || `${ENDPOINTS.USER}/${authorId}/follow-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              return { authorId, isFollowed: data.isFollowing }; // assume API returns { isFollowing: boolean }
            }
          } catch (err) {
            console.error("Failed to fetch follow status for", authorId);
          }
          return { authorId, isFollowed: false };
        })
      ).then(results => {
        const followMap = results.reduce<Record<string, boolean>>((map, item) => {
          if (item && item.authorId) {
            map[item.authorId] = item.isFollowed;
          }
          return map;
        }, {});

        setVideoPosts(prev => prev.map(reel => ({
          ...reel,
          isFollowed: followMap[reel.authorId] ?? reel.isFollowed,
        })));
      }).catch((err) => {
        console.error('Failed to resolve follow statuses', err);
      });
    }
  }, [data, currentUser]);

  const handleLike = useCallback(async (reelId: string) => {
    let originalLiked = false;
    let originalLikeCount = 0;

    setVideoPosts(prev => prev.map(reel => {
      if (reel.id !== reelId) return reel;
      originalLiked = reel.isLiked;
      originalLikeCount = reel.likeCount;
      const newLiked = !reel.isLiked;
      return {
        ...reel,
        isLiked: newLiked,
        likeCount: newLiked ? reel.likeCount + 1 : Math.max(0, reel.likeCount - 1),
      };
    }));

    const reactionType = originalLiked ? 'unlike' : 'like';

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(ENDPOINTS.REEL_LIKE(reelId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ reactionType }),
      });

      if (!response.ok) throw new Error('Failed to update like status');
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message || 'Failed to update like status');
    } catch (err) {
      setVideoPosts(prev => prev.map(reel =>
        reel.id === reelId
          ? { ...reel, isLiked: originalLiked, likeCount: originalLikeCount }
          : reel
      ));
      toast.error('Failed to update like status');
    }
  }, []);

  const handleFollowToggle = useCallback(async (reelId: string, authorId: string, currentlyFollowed: boolean) => {
    // Optimistic update
    setVideoPosts(prev => prev.map(reel => {
      if (reel.id === reelId) {
        return { ...reel, isFollowed: !currentlyFollowed };
      }
      return reel;
    }));

    try {
      const token = localStorage.getItem("auth_token");
      const method = currentlyFollowed ? 'DELETE' : 'POST'; // unfollow if already followed, otherwise follow
      const response = await fetch(ENDPOINTS.FOLLOW(authorId), {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Follow action failed');
      }
      toast.success(currentlyFollowed ? "Unfollowed" : "Followed");
    } catch (err) {
      // Revert on error
      setVideoPosts(prev => prev.map(reel => {
        if (reel.id === reelId) {
          return { ...reel, isFollowed: currentlyFollowed };
        }
        return reel;
      }));
      toast.error("Failed to update follow status");
    }
  }, []);

  const handleShare = useCallback((reelId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/reel/${reelId}`);
    toast.success("Link copied to clipboard!");
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[#F0F2F5]">
      <Header />
      <PageGrid
        left={null}
        center={
          <ReelsFeed
            videoPosts={videoPosts}
            isLoading={isLoading}
            currentUser={currentUser}
            selectedCommentReelId={selectedCommentReelId}
            setSelectedCommentReelId={setSelectedCommentReelId}
            handleLike={handleLike}
            handleFollowToggle={handleFollowToggle}
            handleShare={handleShare}
          />
        }
        right={isDesktop && selectedCommentReelId && currentUser ? (
          <CommentsPanel
            reelId={selectedCommentReelId}
            onClose={() => setSelectedCommentReelId(null)}
            currentUserId={currentUser.id}
          />
        ) : null}
      />
      <BottomNav />
    </div>
  );
}