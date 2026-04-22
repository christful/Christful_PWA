"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import Image from "next/image";

interface SearchResultsGridProps {
  posts: any[];
  onItemClick: (postId: string) => void;
}

export function SearchResultsGrid({ posts, onItemClick }: SearchResultsGridProps) {
  const router = useRouter();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  // Intersection Observer for video autoplay on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observerOptions = {
      threshold: 0.5,
      rootMargin: "0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoElement = entry.target as HTMLVideoElement;
        const postId = videoElement.getAttribute("data-post-id");

        if (!postId) return;

        if (entry.isIntersecting) {
          videoElement.play().catch(() => {
            // Autoplay might be blocked, that's ok
          });
          setPlayingVideoId(postId);
        } else {
          videoElement.pause();
          videoElement.currentTime = 0;
        }
      });
    }, observerOptions);

    // Observe all video elements
    Object.values(videoRefs.current).forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      observer.disconnect();
    };
  }, [posts.length]);

  const handleThumbnailClick = (postId: string) => {
    onItemClick(postId);
  };

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-2 p-2 md:p-3">
      {posts.map((post) => {
        const hasVideo = !!post.videoUrl;
        const hasAudio = !!post.audioUrl;
        const hasImage = !!post.imageUrl;
        const mediaUrl = post.videoUrl || post.imageUrl;

        return (
          <div
            key={post.id}
            onClick={() => handleThumbnailClick(post.id)}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
          >
            {/* Media Content */}
            {hasVideo ? (
              <div className="relative w-full h-full">
                <video
                  ref={(el) => {
                    if (el) videoRefs.current[post.id] = el;
                  }}
                  data-post-id={post.id}
                  src={post.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 fill-white" />
                </div>
              </div>
            ) : hasImage ? (
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt="Post thumbnail"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />
              </div>
            ) : hasAudio ? (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center group-hover:brightness-110 transition-all duration-200">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3v9.28c-.47-.46-1.12-.75-1.84-.75C7.33 11.53 6 12.86 6 14.5s1.33 2.97 3.16 2.97c.72 0 1.37-.29 1.84-.75V21h8V3h-7z" />
                  </svg>
                  <span className="text-xs text-white font-medium">Audio</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-all duration-200">
                <span className="text-xs text-gray-500 text-center px-2">Text Post</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
