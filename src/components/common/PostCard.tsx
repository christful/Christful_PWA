"use client";
import Image from "next/image";
import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share, Ellipsis, Play, Pause, Volume2, MessageSquareText, Heart, Repeat2, Eye, X, Bookmark, Flag, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export interface PostCardProps {
  postId: string;
  postType: 'image' | 'video' | 'audio' | 'text';
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
}: PostCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [liked, setLiked] = useState(isLiked);
  const [currentLikesCount, setCurrentLikesCount] = useState(likesCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const [showFullText, setShowFullText] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const renderMedia = () => {
    switch (postType) {
      case 'image':
        return imageUrl && (
          <div 
            className="relative w-full h-64 md:h-80 overflow-hidden rounded-lg cursor-zoom-in"
            onClick={() => setIsMediaModalOpen(true)}
          >
            <Image
              src={imageUrl}
              alt="Post image"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        );

      case 'video':
        return videoUrl && (
          <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-lg group">
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
            />
            <button 
              onClick={() => setIsMediaModalOpen(true)}
              className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Full screen view"
            >
              <Eye size={18} />
            </button>
          </div>
        );

      case 'audio':
        return audioUrl && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-gray-500" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'text':
      default:
        return null;
    }
  };

  const handleLike = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(ENDPOINTS.LIKE_POST(postId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setLiked(!liked);
        setCurrentLikesCount(liked ? currentLikesCount - 1 : currentLikesCount + 1);
        toast.success(liked ? "Post unliked" : "Post liked");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(ENDPOINTS.FOLLOW(authorId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? "Unfollowed" : "Followed");
      } else {
        toast.error("Failed to follow user");
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    try {
      setLoadingComments(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(ENDPOINTS.COMMENTS(postId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : data.comments || []);
        setShowComments(true);
      } else {
        toast.error("Failed to load comments");
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(ENDPOINTS.COMMENTS(postId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: commentText,
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        setCommentText("");
        toast.success("Comment added");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnPost = localStorage.getItem("userId") === authorId;

  const hasMedia = postType !== 'text' && (imageUrl || videoUrl || audioUrl);

  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="flex items-center justify-between">
        <div className="flex gap-3 items-start">
          <Avatar>
            <AvatarImage src={authorAvatar} />
            <AvatarFallback>
              {authorName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <CardTitle className="text-base font-semibold">
              {authorName}
              {!isOwnPost && (
                <button
                  onClick={handleFollow}
                  disabled={isLoading}
                  className="text-xs text-medium text-[#556B2F] ml-2 hover:underline disabled:opacity-50"
                >
                  · {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
            </CardTitle>
            <CardDescription className="text-sm">{date}</CardDescription>
          </div>
        </div>

        <CardAction className="flex gap-2">
          <Share className="h-5 w-5 cursor-pointer hover:text-gray-600" />
          <Popover>
            <PopoverTrigger asChild>
              <Ellipsis className="h-5 w-5 cursor-pointer hover:text-gray-600" />
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 rounded-xl" align="end">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 text-sm"
                  onClick={() => toast.success("Post saved to Library!")}
                >
                  <Bookmark className="h-4 w-4" /> Save Post
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 text-sm text-orange-600 hover:bg-orange-50"
                  onClick={() => toast.info("Post reported to administrators.")}
                >
                  <Flag className="h-4 w-4" /> Report Post
                </Button>
                {isOwnPost && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => toast.error("Post deletion only available from profile.")}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Post
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {textContent && (
          <div>
            <p className={`text-gray-800 whitespace-pre-line ${!showFullText ? "line-clamp-4" : ""}`}>
              {textContent}
            </p>
            {textContent.length > 280 && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="text-primary hover:underline text-sm font-semibold mt-1"
              >
                {showFullText ? "Show less" : "See more"}
              </button>
            )}
          </div>
        )}

        {hasMedia && renderMedia()}

        {!textContent && postType === 'text' && (
          <p className="text-gray-500 italic">No content</p>
        )}
      </CardContent>

      <CardFooter className="border-t py-4">
        <div className="flex flex-col w-full gap-4">
          {/* Action Buttons */}
          <div className="flex items-center justify-between w-full text-sm text-gray-600 sm:justify-start sm:gap-12">
            <button
              onClick={handleLoadComments}
              disabled={loadingComments}
              className="flex items-center gap-1.5 hover:text-primary transition-colors disabled:opacity-50"
            >
              <MessageSquareText size={18} />
              <span className="font-medium">{commentsCount}</span>
            </button>
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center gap-1.5 transition-colors disabled:opacity-50 ${liked ? "text-red-500" : "hover:text-primary"
                }`}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              <span className="font-medium">{currentLikesCount}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Repeat2 size={18} />
              <span className="font-medium">0</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Eye size={18} />
              <span className="font-medium">0</span>
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="border-t pt-4 space-y-4">
              {/* Comment Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <button
                  onClick={handleAddComment}
                  disabled={isLoading || !commentText.trim()}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? "..." : "Post"}
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length > 0 ? (
                  comments.map((comment, idx) => (
                    <div key={comment.id || idx} className="flex gap-2 p-2 bg-gray-50 rounded">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.authorAvatar} />
                        <AvatarFallback>{comment.authorName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{comment.authorName}</div>
                        <div className="text-sm text-gray-700">{comment.content || comment.text}</div>
                        <div className="text-xs text-gray-500 mt-1">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 text-sm py-4">No comments yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardFooter>

      {/* Media Modal (Review Post) */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <button
            onClick={() => setIsMediaModalOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-[110] bg-black/20 p-2 rounded-full transition-colors"
          >
            <X size={32} />
          </button>

          <div
            className="relative max-w-5xl w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {postType === 'image' && imageUrl && (
              <div className="relative w-full h-full">
                <Image
                  src={imageUrl}
                  alt="Post media full view"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}

            {postType === 'video' && videoUrl && (
              <video
                src={videoUrl}
                className="max-h-full max-w-full rounded-lg shadow-2xl"
                controls
                autoPlay
              />
            )}
          </div>

          {/* Backdrop click to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setIsMediaModalOpen(false)}
          />
        </div>
      )}
    </Card>
  );
}