"use client";

import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    MessageCircle, Heart, Share2, Music2, Plus,
    Bookmark, MoreHorizontal, Clapperboard, Users, Play, Pause
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";

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
}

export default function VideoPage() {
    const [videoPosts, setVideoPosts] = useState<VideoReel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { data, error, isLoading: apiLoading } = useApi<{ posts: ApiPost[] }>(
        `${ENDPOINTS.POSTS}?limit=30`
    );

    useEffect(() => {
        if (data?.posts) {
            const videos = data.posts
                .filter(post => post.videoUrl)
                .map(post => ({
                    id: post.id,
                    author: `${post.author.firstName} ${post.author.lastName}`,
                    authorId: post.author.id,
                    authorAvatar: post.author.avatarUrl,
                    description: post.content,
                    likes: post.likes?.length || 0,
                    comments: post.comments?.length || 0,
                    shares: 0,
                    audio: "Original Audio",
                    videoUrl: post.videoUrl!,
                    createdAt: post.createdAt
                }));
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

    // Left sidebar (unchanged)
    const LeftSidebar = () => (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <nav className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-3 bg-slate-50 text-[#800517]">
                        <Clapperboard size={20} />
                        <span className="font-bold text-sm">For You</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-50">
                        <Users size={20} />
                        <span className="font-bold text-sm">Following</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-50">
                        <Bookmark size={20} />
                        <span className="font-bold text-sm">Saved</span>
                    </Button>
                </nav>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-xs font-bold text-slate-400 mb-4 px-2 uppercase">Popular Creators</h3>
                <div className="space-y-4">
                    {["John Doe", "Sarah Church", "Prayer Group"].map((name, i) => (
                        <div key={i} className="flex items-center gap-3 px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-[10px]">{name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-700">{name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Reels feed with enhanced video controls
    const ReelsFeed = () => {
        const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
        const [iconStates, setIconStates] = useState<{ [key: string]: { show: boolean; type: 'play' | 'pause' } }>({});
        const timeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

        // Clear timeouts on unmount
        useEffect(() => {
            return () => {
                Object.values(timeoutsRef.current).forEach(clearTimeout);
            };
        }, []);

        // Intersection Observer for auto-play/pause
        useEffect(() => {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const video = entry.target as HTMLVideoElement;
                        const reelId = video.dataset.reelId;
                        if (!reelId) return;

                        if (entry.isIntersecting) {
                            // Pause all others first
                            videoRefs.current.forEach((v, id) => {
                                if (id !== reelId) v.pause();
                            });
                            // Play this one (with mute to satisfy autoplay policies)
                            video.muted = true;
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

        const showIcon = (reelId: string, type: 'play' | 'pause') => {
            // Clear previous timeout for this reel
            if (timeoutsRef.current[reelId]) {
                clearTimeout(timeoutsRef.current[reelId]);
            }
            setIconStates(prev => ({ ...prev, [reelId]: { show: true, type } }));
            timeoutsRef.current[reelId] = setTimeout(() => {
                setIconStates(prev => ({ ...prev, [reelId]: { ...prev[reelId], show: false } }));
            }, 800);
        };

        const handleVideoClick = (reelId: string) => {
            const video = videoRefs.current.get(reelId);
            if (!video) return;

            if (video.paused) {
                video.play().then(() => {
                    showIcon(reelId, 'play');
                }).catch(e => console.log('Play failed:', e));
            } else {
                video.pause();
                showIcon(reelId, 'pause');
            }
        };

        return (
            <div className="h-[calc(100vh-8rem)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide rounded-2xl bg-black shadow-2xl relative">
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
                            onClick={() => handleVideoClick(reel.id)}
                        >
                            <video
                                ref={(el) => {
                                    if (el) {
                                        videoRefs.current.set(reel.id, el);
                                        el.dataset.reelId = reel.id;
                                    } else {
                                        videoRefs.current.delete(reel.id);
                                    }
                                }}
                                src={reel.videoUrl}
                                className="absolute inset-0 w-full min-h-0 "
                                loop
                                playsInline
                                preload="metadata"
                                controls={false}
                            />

                            {/* Dark overlay for better text contrast */}
                            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                            {/* Play/Pause icon overlay */}
                            {iconStates[reel.id]?.show && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                    <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                                        {iconStates[reel.id].type === 'play' ? (
                                            <Play className="h-12 w-12 text-white fill-white" />
                                        ) : (
                                            <Pause className="h-12 w-12 text-white fill-white" />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Right Actions Overlay */}
                            <div className="absolute right-4 bottom-12 flex flex-col gap-5 items-center z-10 pointer-events-auto">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden shadow-lg relative">
                                        <Avatar className="h-full w-full">
                                            {reel.authorAvatar ? (
                                                <AvatarImage src={reel.authorAvatar} />
                                            ) : null}
                                            <AvatarFallback className="bg-primary text-white">
                                                {reel.author.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="bg-[#800517] rounded-full p-1 -mt-3 z-10 shadow-md">
                                        <Plus size={12} className="text-white fill-white" />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-white/10 text-white">
                                        <Heart className="h-7 w-7" />
                                    </Button>
                                    <span className="text-[10px] font-bold">{reel.likes}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-white/10 text-white">
                                        <MessageCircle className="h-7 w-7" />
                                    </Button>
                                    <span className="text-[10px] font-bold">{reel.comments}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-white/10 text-white">
                                        <Share2 className="h-7 w-7" />
                                    </Button>
                                    <span className="text-[10px] font-bold">{reel.shares}</span>
                                </div>

                                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-white/10 text-white">
                                    <MoreHorizontal className="h-6 w-6" />
                                </Button>

                                <div className="h-10 w-10 rounded-full bg-slate-800/80 border border-white/20 flex items-center justify-center animate-spin-slow">
                                    <Music2 className="h-5 w-5" />
                                </div>
                            </div>

                            {/* Bottom Info Overlay */}
                            <div className="absolute left-6 bottom-8 right-20 z-10 pointer-events-none">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="font-bold text-lg hover:underline cursor-pointer pointer-events-auto">{reel.author}</h3>
                                    <Button size="sm" className="h-7 bg-white/20 hover:bg-white/30 text-white border border-white/20 text-xs rounded-full px-4 pointer-events-auto">
                                        Follow
                                    </Button>
                                </div>
                                <p className="text-sm line-clamp-2 mb-4 text-white/90 leading-relaxed max-w-sm">
                                    {reel.description}
                                </p>
                                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm w-fit p-1.5 px-3 rounded-full border border-white/10">
                                    <Music2 className="h-3 w-3" />
                                    <div className="overflow-hidden whitespace-nowrap w-24">
                                        <p className="text-[11px] font-medium animate-marquee inline-block">{reel.audio}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    // Suggestions (unchanged)
    const Suggestions = () => {
        const suggested = videoPosts.slice(0, 4);
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border p-5">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Clapperboard size={18} className="text-[#800517]" />
                        Suggested Reels
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {suggested.length > 0 ? suggested.map((reel) => (
                            <div key={reel.id} className="aspect-[9/16] bg-slate-100 rounded-lg relative overflow-hidden group cursor-pointer shadow-sm border">
                                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                    <Clapperboard className="h-8 w-8 text-white/30" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
                                    <p className="text-[10px] text-white font-bold line-clamp-1">{reel.author}</p>
                                    <div className="flex items-center gap-1 text-[8px] text-white/80">
                                        <Clapperboard size={8} />
                                        <span>{reel.likes} likes</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center text-sm text-slate-500 py-4">
                                No suggestions
                            </div>
                        )}
                    </div>
                    <Button variant="secondary" className="w-full mt-4 text-xs font-bold py-5">See More Reels</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F0F2F5]">
            <Header />
            <PageGrid
                left={<LeftSidebar />}
                center={<ReelsFeed />}
                right={<Suggestions />}
            />
            <BottomNav />

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee { animation: marquee 10s linear infinite; }
                .animate-spin-slow { animation: spin 4s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}