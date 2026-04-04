"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageSquareText,
  Repeat2,
  Ellipsis,
  Bookmark,
  Trash2,
  Flag,
  X,
  ChevronDown,
  UserPlus,
  UserMinus,
  Smile,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import {
  Popover as EmojiPopover,
  PopoverContent as EmojiPopoverContent,
  PopoverTrigger as EmojiPopoverTrigger,
} from "@/components/ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// Types for comment (including replies)
interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  parentId?: string | null;
  replies?: Comment[];
  likesCount?: number;
  isLiked?: boolean;
}

export interface PostCardProps {
  postId: string;
  postType: "image" | "video" | "audio" | "text";
  authorId: string;
  authorName: string;
  authorAvatar: string;
  date: string;
  textContent?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isReel?: boolean;
  isFollowing?: boolean;
  onDelete?: () => void;
}

export function PostCard({
  postId,
  postType,
  authorId,
  authorName,
  authorAvatar,
  date,
  textContent,
  imageUrl,
  videoUrl,
  audioUrl,
  likesCount = 0,
  commentsCount = 0,
  isLiked = false,
  isSaved = false,
  isReel = false,
  isFollowing: initialIsFollowing = false,
  onDelete,
}: PostCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(isSaved);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [currentLikesCount, setCurrentLikesCount] = useState(likesCount);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isOwnPost = currentUserId === authorId;
  const commentsUrl = isReel ? ENDPOINTS.REEL_COMMENTS(postId) : ENDPOINTS.COMMENTS(postId);
  const likeUrl = isReel ? ENDPOINTS.REEL_LIKE(postId) : ENDPOINTS.LIKE_POST(postId);
  const canSavePost = !isReel;
  const canDeletePost = isOwnPost && !isReel;

  // Fetch follow status and comments when modal opens
  useEffect(() => {
    if (isCommentsModalOpen && comments.length === 0) {
      fetchComments();
    }
  }, [isCommentsModalOpen]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!currentUserId || isOwnPost) return;
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(ENDPOINTS.FOLLOW_STATUS(authorId), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Failed to fetch follow status:", error);
      }
    };
    fetchFollowStatus();
  }, [authorId, currentUserId, isOwnPost]);

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(commentsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const flatComments = Array.isArray(data) ? data : data.comments || [];
        const commentMap = new Map<string, Comment>();
        const roots: Comment[] = [];

        flatComments.forEach((c: any) => {
          commentMap.set(c.id, {
            ...c,
            replies: [],
            authorName: `${c.author.firstName} ${c.author.lastName}`,
            authorId: c.author.id,
            authorAvatar: c.author.avatarUrl,
            likesCount: c.likes?.length || 0,
            isLiked: c.likes?.some((like: any) => like.userId === currentUserId) || false,
          });
        });

        flatComments.forEach((c: any) => {
          const comment = commentMap.get(c.id)!;
          if (c.parentId) {
            const parent = commentMap.get(c.parentId);
            if (parent) parent.replies!.push(comment);
            else roots.push(comment);
          } else {
            roots.push(comment);
          }
        });

        setComments(roots);
      }
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = currentLikesCount;

    setLiked(!liked);
    setCurrentLikesCount(liked ? prevCount - 1 : prevCount + 1);

    try {
      const token = localStorage.getItem("auth_token");
      await fetch(likeUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setLiked(prevLiked);
      setCurrentLikesCount(prevCount);
      toast.error("Failed to update like");
    }
  };

  const handleSaveToggle = async () => {
    if (isReel) {
      toast.error("Saving reels is not supported.");
      setDropdownOpen(false);
      return;
    }

    const prevSaved = saved;
    setSaved(!saved);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.SAVE_POST(postId), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to save/unsave post");

      toast.success(saved ? "Post removed from saved" : "Post saved");
    } catch {
      setSaved(prevSaved);
      toast.error("Failed to update saved status");
    } finally {
      setDropdownOpen(false);
    }
  };

  const handleDeletePost = async () => {
    setDeleteDialogOpen(false);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.DELETE_POST(postId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete post");

      toast.success("Post deleted successfully");
      if (onDelete) onDelete();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleReportPost = () => {
    setReportDialogOpen(false);
    toast.success("Post reported. Thank you for keeping our community safe.");
  };

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const videoEl = videoRef.current;
    videoEl.muted = true;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoEl.play().catch(() => {
            /* auto-play blocked, ignore */
          });
        } else {
          videoEl.pause();
          videoEl.currentTime = 0;
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.6,
    });

    observer.observe(videoEl);
    return () => {
      observer.disconnect();
    };
  }, [videoUrl]);

  const handleFollow = async () => {
    if (!currentUserId) {
      toast.error("Please login to follow users");
      return;
    }
    const previous = isFollowing;
    setIsFollowing(!previous);

    try {
      const token = localStorage.getItem("auth_token");
      const method = previous ? "DELETE" : "POST";
      const response = await fetch(ENDPOINTS.FOLLOW(authorId), {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to update follow status");

      toast.success(previous ? "Unfollowed user" : "Following user");
    } catch {
      setIsFollowing(previous);
      toast.error(`Failed to ${previous ? 'unfollow' : 'follow'} user`);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setIsPostingComment(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(commentsUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: commentText,
          parentId: replyingTo?.id || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newComment = result.comment || result;
        const formatted = {
          ...newComment,
          authorName: `${newComment.author.firstName} ${newComment.author.lastName}`,
          authorId: newComment.author.id,
          authorAvatar: newComment.author.avatarUrl,
          likesCount: 0,
          isLiked: false,
          replies: [],
        };

        if (replyingTo) {
          setComments(prev =>
            prev.map(c =>
              c.id === replyingTo.id
                ? { ...c, replies: [...(c.replies || []), formatted] }
                : c
            )
          );
        } else {
          setComments(prev => [...prev, formatted]);
        }
        setCommentText("");
        setReplyingTo(null);
        toast.success("Comment posted!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to add comment");
      }
    } catch (error) {
      toast.error("An error occurred while posting comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    setComments((prev) => prev.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: comment.isLiked ? Math.max((comment.likesCount || 0) - 1, 0) : (comment.likesCount || 0) + 1,
          }
        : comment
    ));

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.LIKE_COMMENT(commentId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to like comment");
    } catch (err) {
      setComments((prev) => prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likesCount: comment.isLiked ? Math.max((comment.likesCount || 0) - 1, 0) : (comment.likesCount || 0) + 1,
            }
          : comment
      ));
      toast.error("Failed to like comment");
    }
  };

  const addEmoji = (emoji: any) => {
    setCommentText(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // Navigate to post detail page (for images and regular videos)
  const navigateToPost = () => {
    router.push(`/posts/${postId}`);
  };

  const renderMedia = () => {
    const mediaClasses = "relative w-full bg-gradient-to-br from-gray-900 to-black overflow-hidden";

    switch (postType) {
      case "image":
        return imageUrl && (
          <div
            className={cn(
              mediaClasses,
              "aspect-square sm:aspect-[4/5] cursor-pointer group",
              "w-full",
              "border-0"
            )}
            onClick={navigateToPost}
          >
            <Image
              src={imageUrl}
              alt="Post content"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="100vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        );

      case "video":
        // Treat video posts like images for navigation: go to post detail first.
        return videoUrl && (
          <div
            className="relative w-full bg-black overflow-hidden aspect-video cursor-pointer group"
            onClick={navigateToPost}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              playsInline
              preload="metadata"
              muted
              loop
            />
          </div>
        );

      case "audio":
        return audioUrl && (
          <div
            className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-xl sm:border border-gray-100 dark:border-gray-800 p-4 shadow-inner cursor-pointer"
            onClick={navigateToPost}
          >
            <audio
              src={audioUrl}
              controls
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={cn("flex gap-3 group", depth > 0 && "ml-8 mt-2")}>
      <Link href={`/profile/${comment.authorId}`} className="shrink-0" onClick={() => setIsCommentsModalOpen(false)}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.authorAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {comment.authorName?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1">
        <div className="bg-white dark:bg-gray-950 rounded-2xl px-4 py-2.5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <Link
              href={`/profile/${comment.authorId}`}
              className="font-semibold text-sm hover:text-primary transition-colors"
              onClick={() => setIsCommentsModalOpen(false)}
            >
              {comment.authorName}
            </Link>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1 ml-2">
          <button
            onClick={() => setReplyingTo({ id: comment.id, name: comment.authorName })}
            className="text-xs text-gray-500 hover:text-primary transition-colors"
          >
            Reply
          </button>
          <button
            onClick={() => handleCommentLike(comment.id)}
            className="text-xs text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            <Heart size={12} className={comment.isLiked ? "fill-red-500 text-red-500" : ""} />
            {comment.likesCount ? comment.likesCount : ""}
          </button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Card className="rounded-none sm:rounded-2xl border-y sm:border border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-950 shadow-none sm:shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-2 sm:mb-6">
        {/* HEADER with Follow Button */}
        <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex gap-3">
            <Link href={`/profile/${authorId}`} className="group">
              <Avatar className="h-11 w-11 ring-2 ring-white dark:ring-gray-900 group-hover:ring-primary/20 transition-all">
                <AvatarImage src={authorAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {authorName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/profile/${authorId}`}
                  className="hover:text-primary transition-colors"
                >
                  <span className=" font-semibold leading-none block text-[12px]">
                    {authorName}
                  </span>
                </Link>
                {isReel && (
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                    Reel
                  </span>
                )}
                {!isOwnPost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFollow}
                    className={cn(
                      "h-7 px-3 text-xs rounded-full gap-1 font-semibold transition-all duration-200 active:scale-95",
                      isFollowing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus size={14} />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                {formatRelativeTime(date)}
              </span>
            </div>
          </div>

          <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1 rounded-xl">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleSaveToggle}
              >
                <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
                {saved ? "Saved" : "Save post"}
              </Button>

              {canDeletePost && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                  onClick={() => {
                    setDropdownOpen(false);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete post
                </Button>
              )}

              {!isOwnPost && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/50 rounded-lg"
                  onClick={() => {
                    setDropdownOpen(false);
                    setReportDialogOpen(true);
                  }}
                >
                  <Flag className="h-4 w-4" />
                  Report post
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="p-0 sm:px-5 sm:pb-4 space-y-3">
          {textContent && (
            <div className="text-[14px] sm:text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 px-4 sm:px-0 pt-2 sm:pt-0">
              <p className={cn("px-5", !showFullText && "line-clamp-4")}>
                {textContent}
              </p>

              {textContent.length > 250 && (
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-sm text-primary hover:text-primary/80 font-medium mt-2 inline-flex items-center gap-1 group"
                >
                  {showFullText ? "Show less" : "See more"}
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    showFullText && "rotate-180"
                  )} />
                </button>
              )}
            </div>
          )}

          {renderMedia()}
        </CardContent>

        {/* ENGAGEMENT METRICS */}
        {(currentLikesCount > 0 || comments.length > 0 || commentsCount > 0) && (
          <div className="px-4 sm:px-5 pb-2 pt-2 sm:pt-0 flex items-center gap-3 text-[13px] text-gray-500 dark:text-gray-400">
            {currentLikesCount > 0 && (
              <span className="font-medium">
                {currentLikesCount} {currentLikesCount === 1 ? 'like' : 'likes'}
              </span>
            )}
            {(comments.length || commentsCount) > 0 && (
              <span className="font-medium">
                {comments.length || commentsCount} comments
              </span>
            )}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <CardFooter className="border-t border-gray-100 dark:border-gray-800/50 px-2 sm:px-4 py-2">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-300 active:scale-90",
                liked
                  ? "text-red-500"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
              )}
            >
              <Heart
                size={20}
                fill={liked ? "currentColor" : "none"}
                className={cn("transition-transform", liked && "scale-110")}
              />
              <span className="text-sm font-medium hidden sm:inline">Like</span>
            </button>

            <button
              onClick={() => setIsCommentsModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 active:scale-95"
            >
              <MessageSquareText size={20} />
              <span className="text-sm font-medium hidden sm:inline">Comment</span>
            </button>

            <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 active:scale-95">
              <Repeat2 size={20} />
              <span className="text-sm font-medium hidden sm:inline">Share</span>
            </button>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog (custom) */}
      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteDialogOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-950 rounded-lg p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Delete post?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeletePost}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Confirmation Dialog (custom) */}
      {reportDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setReportDialogOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-950 rounded-lg p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Report this post?</h3>
            <p className="text-sm text-gray-500 mb-6">
              If this post violates community guidelines, our moderators will review it.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReportPost}>
                Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {isCommentsModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsCommentsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-950 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-lg">Comments</h3>
              <button
                onClick={() => setIsCommentsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map(comment => renderComment(comment))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquareText className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              {replyingTo && (
                <div className="flex items-center justify-between bg-primary/5 text-sm px-3 py-2 rounded-lg mb-3">
                  <span>
                    Replying to <span className="font-semibold">{replyingTo.name}</span>
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={localStorage.getItem("userAvatar") || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {localStorage.getItem("userName")?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a comment..."}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={isPostingComment}
                      className="w-full bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-xl focus-visible:ring-primary pr-10"
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <EmojiPopover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <EmojiPopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-gray-400 hover:text-primary"
                        >
                          <Smile size={18} />
                        </Button>
                      </EmojiPopoverTrigger>
                      <EmojiPopoverContent className="p-0 border-none shadow-xl">
                        <Picker data={data} onEmojiSelect={addEmoji} theme="light" />
                      </EmojiPopoverContent>
                    </EmojiPopover>
                  </div>

                  <Button
                    onClick={handleAddComment}
                    disabled={isPostingComment || !commentText.trim()}
                    className="rounded-xl px-5 bg-primary hover:bg-primary/90 text-white"
                  >
                    {isPostingComment ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}