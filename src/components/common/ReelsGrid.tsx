"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, ArrowRight } from "lucide-react";

interface Reel {
  id: string;
  videoUrl?: string;
  imageUrl?: string;
  content?: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  createdAt?: string;
}

interface ReelsGridProps {
  reels: Reel[];
  showSeeMore?: boolean;
  seeMoreUrl?: string;
}

export function ReelsGrid({ reels, showSeeMore = false, seeMoreUrl = "/video" }: ReelsGridProps) {
  const router = useRouter();
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  useEffect(() => {
    if (typeof window === "undefined" || reels.length === 0) return;

    const observerOptions = {
      threshold: 0.5,
      rootMargin: "0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoElement = entry.target as HTMLVideoElement;
        const reelId = videoElement.getAttribute("data-reel-id");

        if (!reelId) return;

        if (entry.isIntersecting) {
          videoElement.play().catch(() => {
            // Autoplay might be blocked
          });
        } else {
          videoElement.pause();
          videoElement.currentTime = 0;
        }
      });
    }, observerOptions);

    Object.values(videoRefs.current).forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      observer.disconnect();
    };
  }, [reels.length]);

  if (reels.length === 0 && !showSeeMore) return null;

  const cells = [...reels];
  if (showSeeMore) {
    cells.push({ id: "see-more" } as Reel);
  }

  while (cells.length < 3) {
    cells.push({ id: `placeholder-${cells.length}` } as Reel);
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-1 md:gap-2 p-2 md:p-0">
        {cells.map((reel, index) => {
          const isSeeMore = showSeeMore && reel.id === "see-more";
          const isPlaceholder = !reel.videoUrl && !reel.imageUrl && reel.id.startsWith("placeholder");

          if (isPlaceholder) {
            return <div key={reel.id} className="aspect-square rounded-md bg-transparent" />;
          }

          if (isSeeMore) {
            return (
              <div
                key="see-more"
                onClick={() => router.push(seeMoreUrl)}
                className="relative aspect-square cursor-pointer group overflow-hidden bg-gradient-to-br from-[#ffff] to-[#f2f2f2] rounded-md flex items-center justify-center"
              >
                <div className="text-center px-3">
                  <div className="mb-2 flex items-center justify-center text-black p-4 rounded-full bg-white/80 group-hover:bg-white transition-all duration-200">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <span className="text-black font-semibold text-md md:text-blsck">See More</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={reel.id}
              onClick={() => router.push(`/video?id=${reel.id}`)}
              className="relative aspect-square cursor-pointer group overflow-hidden bg-black rounded-md"
            >
              {reel.videoUrl ? (
                <div className="w-full h-full relative">
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current[reel.id] = el;
                    }}
                    data-reel-id={reel.id}
                    src={reel.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                    <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 fill-white" />
                  </div>
                </div>
              ) : reel.imageUrl ? (
                <div className="w-full h-full relative overflow-hidden">
                  <img
                    src={reel.imageUrl}
                    alt="Reel thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                    <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 fill-white" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center group-hover:brightness-110 transition-all duration-200">
                  <div className="text-center">
                    <Play className="w-8 h-8 text-white fill-white mx-auto mb-1" />
                    <span className="text-xs text-white font-medium">Video</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
