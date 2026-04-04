"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import {
  Heart,
  MessageSquareText,
  Repeat2,
  Bookmark,
  Flag,
  Trash2,
  Ellipsis,
  ChevronLeft,
  UserPlus,
  UserMinus,
  Smile,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// Types
interface Post {
  id: string;
  content: string;
  mediaType: string;
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
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isReel, setIsReel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentLikesCount, setCurrentLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isOwnPost = post ? currentUserId === post.author.id : false;

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        let res = await fetch(ENDPOINTS.POST_DETAIL(postId), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // fallback to reels API for reel IDs
          res = await fetch(ENDPOINTS.REEL_DETAIL(postId), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch post/reel");
          const reelData = await res.json();
          setIsReel(true);
          const postFromReel = {
            ...reelData,
            mediaType: "video",
            imageUrl: undefined,
            audioUrl: undefined,
            // ensure comments exists for the comments loader
            comments: reelData.comments || [],
            likes: reelData.likes || [],
          };
          setPost(postFromReel);
          setLiked(reelData.isLiked || false);
          setSaved(false);
          setCurrentLikesCount(reelData.likes?.length || 0);

          if (currentUserId && reelData.author?.id && reelData.author.id !== currentUserId) {
            fetchFollowStatus(reelData.author.id);
          }
          return;
        }

        const data = await res.json();
        console.log("get post details",data)
        setPost(data);
        setIsReel(false);
        setLiked(data.isLiked || false);
        setSaved(data.isSaved || false);
        setCurrentLikesCount(data.likes?.length || 0);

        if (currentUserId && data.author.id !== currentUserId) {
          fetchFollowStatus(data.author.id);
        }
      } catch (error) {
        toast.error("Could not load post");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (postId) fetchPost();
  }, [postId, currentUserId]);

  const fetchFollowStatus = async (authorId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(ENDPOINTS.FOLLOW_STATUS(authorId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Failed to fetch follow status:", error);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        isReel ? ENDPOINTS.REEL_COMMENTS(postId) : ENDPOINTS.COMMENTS(postId),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const flatComments = Array.isArray(data) ? data : data.comments || [];
        const commentMap = new Map<string, Comment>();
        const roots: Comment[] = [];

        flatComments.forEach((c: any) => {
          commentMap.set(c.id, {
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            authorId: c.author.id,
            authorName: `${c.author.firstName} ${c.author.lastName}`,
            authorAvatar: c.author.avatarUrl,
            likesCount: c.likes?.length || 0,
            isLiked: c.likes?.some((like: any) => like.userId === currentUserId) || false,
            parentId: c.parentId,
            replies: [],
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
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, isReel]);

  // Handlers
  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = currentLikesCount;

    setLiked(!liked);
    setCurrentLikesCount(liked ? prevCount - 1 : prevCount + 1);

    try {
      const token = localStorage.getItem("auth_token");
      const endpoint = isReel ? ENDPOINTS.REEL_LIKE(postId) : ENDPOINTS.LIKE_POST(postId);
      await fetch(endpoint, {
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
      if (!response.ok) throw new Error();
      toast.success(saved ? "Post removed from saved" : "Post saved");
    } catch {
      setSaved(prevSaved);
      toast.error("Failed to update saved status");
    } finally {
      setDropdownOpen(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || !post) return;
    const previous = isFollowing;
    setIsFollowing(!previous);
    try {
      const token = localStorage.getItem("auth_token");
      const method = previous ? "DELETE" : "POST";
      const response = await fetch(ENDPOINTS.FOLLOW(post.author.id), {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      toast.success(previous ? "Unfollowed user" : "Following user");
    } catch {
      setIsFollowing(previous);
      toast.error(`Failed to ${previous ? "unfollow" : "follow"} user`);
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
      if (!response.ok) throw new Error();
      toast.success("Post deleted successfully");
      router.push("/home");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleReportPost = () => {
    setReportDialogOpen(false);
    toast.success("Post reported. Thank you for keeping our community safe.");
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setIsPostingComment(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.POST_COMMENTS(postId), {
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
        const formatted: Comment = {
          id: newComment.id,
          content: newComment.content,
          createdAt: newComment.createdAt,
          authorId: newComment.author.id,
          authorName: `${newComment.author.firstName} ${newComment.author.lastName}`,
          authorAvatar: newComment.author.avatarUrl,
          likesCount: 0,
          isLiked: false,
          parentId: replyingTo?.id || null,
          replies: [],
        };

        if (replyingTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.id
                ? { ...c, replies: [...(c.replies || []), formatted] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, formatted]);
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

  const addEmoji = (emoji: any) => {
    setCommentText((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={cn("flex gap-3 group", depth > 0 && "ml-8 mt-2")}>
      <Link href={`/profile/${comment.authorId}`} className="shrink-0">
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
              className="font-semibold text-sm hover:text-primary"
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
            className="text-xs text-gray-500 hover:text-primary"
          >
            Reply
          </button>
          <button className="text-xs text-gray-500 hover:text-primary flex items-center gap-1">
            <Heart size={12} className={comment.isLiked ? "fill-red-500 text-red-500" : ""} />
            {comment.likesCount}
          </button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4"
          >
            <ChevronLeft size={20} />
            Back
          </button>

          {/* Media section */}
          <div className="bg-black rounded-xl overflow-hidden mb-6">
            {(post.mediaType === "image" || post.imageUrl) && post.imageUrl && (
              <div className="relative w-full aspect-video sm:aspect-video">
                <Image
                  src={post.imageUrl}
                  alt="Post"
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            )}
            {((post.mediaType === "video" || post.mediaType === "text_video") && post.videoUrl) && (
              <div className="relative w-full aspect-video">
                <video
                  src={post.videoUrl}
                  controls
                  className="w-full h-full"
                  playsInline
                />
              </div>
            )}
            {post.mediaType === "audio" && post.audioUrl && (
              <div className="p-8 bg-gray-100 dark:bg-gray-800">
                <audio src={post.audioUrl} controls className="w-full" />
              </div>
            )}
          </div>

          {/* Title / content */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {post.content}
            </h1>
            <p className="text-sm text-gray-500">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>

          {/* Author bar */}
          <div className="flex items-center justify-between border-y border-gray-200 dark:border-gray-800 py-4 mb-6">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.author.id}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author.avatarUrl} />
                  <AvatarFallback>{post.author.firstName[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link href={`/profile/${post.author.id}`} className="font-semibold hover:text-primary">
                  {post.author.firstName} {post.author.lastName}
                </Link>
                <p className="text-xs text-gray-500">{currentLikesCount} likes</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isOwnPost && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollow}
                  className={cn(
                    "rounded-full gap-1",
                    isFollowing
                      ? "border-gray-300 text-gray-700"
                      : "bg-primary text-white hover:bg-primary/90"
                  )}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus size={16} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Follow
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                className={cn("rounded-full", liked && "text-red-500")}
              >
                <Heart size={20} fill={liked ? "currentColor" : "none"} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveToggle}
                className="rounded-full"
              >
                <Bookmark size={20} className={saved ? "fill-current" : ""} />
              </Button>

              <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Ellipsis size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1 rounded-xl">
                  {!isOwnPost && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                      onClick={() => {
                        setDropdownOpen(false);
                        setReportDialogOpen(true);
                      }}
                    >
                      <Flag size={16} />
                      Report
                    </Button>
                  )}
                  {isOwnPost && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 rounded-lg"
                      onClick={() => {
                        setDropdownOpen(false);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Comments section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>

            {/* Comment input */}
            <div className="flex gap-3 mb-6">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={localStorage.getItem("userAvatar") || ""} />
                <AvatarFallback>{localStorage.getItem("userName")?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a comment..."}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isPostingComment}
                    className="w-full pr-10"
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-gray-400 hover:text-primary"
                      >
                        <Smile size={18} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-none shadow-xl">
                      <Picker data={data} onEmojiSelect={addEmoji} theme="light" />
                    </PopoverContent>
                  </Popover>
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
            {replyingTo && (
              <div className="flex items-center justify-between bg-primary/5 text-sm px-3 py-2 rounded-lg mb-3">
                <span>
                  Replying to <span className="font-semibold">{replyingTo.name}</span>
                </span>
                <button onClick={() => setReplyingTo(null)} className="text-gray-500">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No comments yet.</p>
              ) : (
                comments.map((comment) => renderComment(comment))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom confirmation modals */}
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
              Our moderators will review it.
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

      <BottomNav />
    </div>
  );
}