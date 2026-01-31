"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft, Send, Heart, MessageSquare, Share2, MoreHorizontal, ThumbsUp } from "lucide-react";
import Image from "next/image";

interface Comment {
    id: string;
    content: string;
    author: {
        firstName: string;
        lastName: string;
        avatarUrl: string;
    };
    createdAt: string;
    likes: number;
    replies?: Comment[];
}

interface Post {
    id: string;
    content: string;
    postType: 'image' | 'video' | 'audio' | 'text';
    author: {
        firstName: string;
        lastName: string;
        avatarUrl: string;
    };
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
}

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (postId) {
            fetchPostAndComments();
        }
    }, [postId]);

    const fetchPostAndComments = async () => {
        try {
            const token = localStorage.getItem("auth_token");

            const [postRes, commentsRes] = await Promise.all([
                fetch(ENDPOINTS.POST_DETAIL(postId), {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(ENDPOINTS.COMMENTS(postId), {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (postRes.ok) {
                const postData = await postRes.json();
                setPost(postData);
            } else {
                toast.error("Post not found");
                router.push("/home");
                return;
            }

            if (commentsRes.ok) {
                const commentsData = await commentsRes.json();
                setComments(commentsData.comments || []);
            }
        } catch (error) {
            console.error("Error fetching post details:", error);
            toast.error("Failed to load post");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim()) return;

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(ENDPOINTS.COMMENTS(postId), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: commentInput }),
            });

            if (response.ok) {
                setCommentInput("");
                toast.success("Comment posted");
                // Refresh comments
                const commentsRes = await fetch(ENDPOINTS.COMMENTS(postId), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (commentsRes.ok) {
                    const data = await commentsRes.json();
                    setComments(data.comments || []);
                }
            } else {
                toast.error("Failed to post comment");
            }
        } catch (error) {
            console.error("Error posting comment:", error);
            toast.error("Failed to post comment");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-[#F0F2F5] pb-20 md:pb-0">
            <Header />

            <div className="pt-20 pb-10 max-w-2xl mx-auto px-0 md:px-4">
                {/* Navigation */}
                <div className="flex items-center px-4 md:px-0 mb-4 sticky top-20 z-10 bg-[#F0F2F5]/90 backdrop-blur pb-2">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors mr-2"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-800">Post</h1>
                </div>

                <Card className="border-0 shadow-sm md:rounded-xl rounded-none mb-4">
                    {/* Post Header */}
                    <CardHeader className="flex flex-row items-center gap-3 p-4">
                        <Avatar>
                            <AvatarImage src={post.author.avatarUrl} />
                            <AvatarFallback>{post.author.firstName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm text-gray-900">
                                {post.author.firstName} {post.author.lastName}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </CardHeader>

                    {/* Post Content */}
                    <CardContent className="p-0">
                        {post.content && (
                            <p className="px-4 pb-4 text-base text-gray-800 whitespace-pre-line">
                                {post.content}
                            </p>
                        )}

                        {post.imageUrl && (
                            <div className="relative w-full aspect-square md:aspect-video bg-black">
                                <Image
                                    src={post.imageUrl}
                                    alt="Post content"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )}
                        {post.videoUrl && (
                            <video
                                src={post.videoUrl}
                                controls
                                className="w-full max-h-[500px] bg-black"
                            />
                        )}
                    </CardContent>

                    {/* Post Stats */}
                    <div className="px-4 py-2 flex justify-between text-xs text-gray-500 border-b border-gray-100 mx-4">
                        <div className="flex items-center gap-1">
                            <div className="bg-blue-500 rounded-full p-1">
                                <ThumbsUp className="h-2 w-2 text-white" fill="white" />
                            </div>
                            <span>{post.likesCount}</span>
                        </div>
                        <div className="flex gap-3">
                            <span>{post.commentsCount} comments</span>
                            <span>0 shares</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <CardFooter className="px-2 py-1 flex justify-between">
                        <Button variant="ghost" className="flex-1 gap-2 text-gray-600 hover:bg-gray-100">
                            <ThumbsUp className="h-5 w-5" />
                            Like
                        </Button>
                        <Button variant="ghost" className="flex-1 gap-2 text-gray-600 hover:bg-gray-100">
                            <MessageSquare className="h-5 w-5" />
                            Comment
                        </Button>
                        <Button variant="ghost" className="flex-1 gap-2 text-gray-600 hover:bg-gray-100">
                            <Share2 className="h-5 w-5" />
                            Share
                        </Button>
                    </CardFooter>
                </Card>

                {/* Comments Section */}
                <div className="bg-white md:rounded-xl shadow-sm">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-700">Comments</h3>
                    </div>

                    <div className="p-4 space-y-6">
                        {comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.author.avatarUrl} />
                                        <AvatarFallback>{comment.author.firstName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block">
                                            <h4 className="font-semibold text-xs text-gray-900">
                                                {comment.author.firstName} {comment.author.lastName}
                                            </h4>
                                            <p className="text-sm text-gray-800 mt-0.5">{comment.content}</p>
                                        </div>
                                        <div className="flex gap-4 mt-1 ml-2 text-xs text-gray-500 font-medium">
                                            <button className="hover:underline">Like</button>
                                            <button className="hover:underline">Reply</button>
                                            <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No comments yet. Be the first to share your thoughts!
                            </div>
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="p-4 border-t sticky bottom-0 bg-white">
                        <form onSubmit={handlePostComment} className="flex gap-3 items-center">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>ME</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 relative">
                                <Input
                                    placeholder="Write a comment..."
                                    className="rounded-full bg-gray-100 border-none px-4 py-2"
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!commentInput.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary disabled:opacity-50 hover:bg-gray-200 rounded-full"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>

            <BottomNav />
        </div>
    );
}
