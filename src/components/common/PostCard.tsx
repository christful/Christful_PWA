"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
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
  isFollowing?: boolean; // Initial follow state
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
  isFollowing: initialIsFollowing = false,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(isSaved);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [currentLikesCount, setCurrentLikesCount] = useState(likesCount);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isOwnPost = currentUserId === authorId;

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
          // Assuming backend returns { isFollowing: boolean }
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
      const response = await fetch(ENDPOINTS.COMMENTS(postId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Assume API returns flat comments; build tree
        const flatComments = Array.isArray(data) ? data : data.comments || [];
        const commentMap = new Map<string, Comment>();
        const roots: Comment[] = [];

        flatComments.forEach((c: any) => {
          commentMap.set(c.id, { ...c, replies: [] });
        });

        flatComments.forEach((c: any) => {
          const comment = commentMap.get(c.id)!;
          if (c.parentId) {
            const parent = commentMap.get(c.parentId);
            if (parent) {
              parent.replies!.push(comment);
            } else {
              roots.push(comment); // fallback
            }
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
      await fetch(ENDPOINTS.LIKE_POST(postId), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setLiked(prevLiked);
      setCurrentLikesCount(prevCount);
      toast.error("Failed to update like");
    }
  };

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

      if (!response.ok) {
        throw new Error("Failed to update follow status");
      }

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
      const response = await fetch(ENDPOINTS.POST_COMMENTS(postId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: commentText,
          parentId: replyingTo?.id || null, // Changed from parentCommentId to parentId to be more standard
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Backend usually returns the new comment object
        const newComment = result.comment || result;

        // Add new comment to tree
        if (replyingTo) {
          setComments(prev =>
            prev.map(c =>
              c.id === replyingTo.id
                ? { ...c, replies: [...(c.replies || []), newComment] }
                : c
            )
          );
        } else {
          setComments(prev => [...prev, { ...newComment, replies: [] }]);
        }
        setCommentText("");
        setReplyingTo(null);
        toast.success("Comment posted!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Comment error:", error);
      toast.error("An error occurred while posting comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    toast.info("Comment like coming soon");
  };

  const addEmoji = (emoji: any) => {
    setCommentText(prev => prev + emoji.native);
    setShowEmojiPicker(false);
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

        {/* Comment actions */}
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

        {/* Render replies recursively */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMedia = () => {
    const mediaClasses = "relative w-full bg-gradient-to-br from-gray-900 to-black overflow-hidden";

    switch (postType) {
      case "image":
        return imageUrl && (
          <div
            className={cn(
              mediaClasses,
              "aspect-square md:aspect-[4/5] cursor-zoom-in group",
              "-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full",
              "border-0"
            )}
            onClick={() => setIsMediaModalOpen(true)}
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
        return videoUrl && (
          <div className={cn(
            mediaClasses,
            "aspect-video",
            "-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full",
            "border-0"
          )}>
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        );

      case "audio":
        return audioUrl && (
          <div className={cn(
            "w-full h-full bg-gray-100 dark:bg-gray-800",
            "-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full",
            "px-4 py-4 md:rounded-xl md:border md:border-gray-200 md:dark:border-gray-700"
          )}>
            <audio src={audioUrl} controls className="w-full" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="md:rounded-2xl border-0 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {/* HEADER with Follow Button */}
        <CardHeader className="flex flex-row items-start justify-between px-4 md:px-5">
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
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${authorId}`}
                  className="hover:text-primary transition-colors"
                >
                  <span className="text-base font-semibold leading-none block">
                    {authorName}
                  </span>
                </Link>
                {!isOwnPost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFollow}
                    className={cn(
                      "h-7 px-2 text-xs rounded-full gap-1",
                      isFollowing
                        ? "text-gray-600 hover:text-gray-900 dark:text-gray-300"
                        : "text-primary hover:text-primary/80"
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1 rounded-xl">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setSaved(!saved)}
              >
                <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
                {saved ? "Saved" : "Save post"}
              </Button>
              {isOwnPost && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete post
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="pt-0 pb-2 space-y-4">
          {textContent && (
            <div className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
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
          <div className="px-4 md:px-5 pb-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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
        <CardFooter className="border-t border-gray-100 dark:border-gray-800 px-4 md:px-5 py-3">
          <div className="flex items-center justify-between w-full">
            {/* LIKE */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200",
                liked
                  ? "text-red-500 bg-red-50 dark:bg-red-950/30"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Heart
                size={20}
                fill={liked ? "currentColor" : "none"}
                className={cn("transition-transform", liked && "scale-110")}
              />
              <span className="text-sm font-medium hidden sm:inline">
                Like
              </span>
            </button>

            {/* COMMENT - now opens modal */}
            <button
              onClick={() => setIsCommentsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <MessageSquareText size={20} />
              <span className="text-sm font-medium hidden sm:inline">
                Comment
              </span>
            </button>

            {/* SHARE */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
              <Repeat2 size={20} />
              <span className="text-sm font-medium hidden sm:inline">
                Share
              </span>
            </button>
          </div>
        </CardFooter>
      </Card>

      {/* MEDIA MODAL */}
      {isMediaModalOpen && imageUrl && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsMediaModalOpen(false)}
        >
          <button
            onClick={() => setIsMediaModalOpen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all duration-200"
          >
            <X size={28} />
          </button>

          <div
            className="relative w-full max-w-6xl max-h-[90vh] aspect-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageUrl}
              alt="Full view"
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
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
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-lg">Comments</h3>
              <button
                onClick={() => setIsCommentsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable Comments */}
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

            {/* Modal Footer - Comment Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              {/* Replying indicator */}
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

              {/* Input area */}
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