"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft, Image, Video, Music } from "lucide-react";

export default function CreatePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"post" | "reel">("post");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isReelMode = activeTab === "reel";

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      toast.error("Please login to create a post");
      router.push("/auth/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleFileSelect = (file: File, type: "image" | "video" | "audio") => {
    if (isReelMode && type !== "video") {
      toast.error("Only videos can be posted as reels");
      return;
    }

    if (type === "video") {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        setVideoDuration(duration);
        if (isReelMode && duration > 60) {
          toast.warning("Reels are limited to 1 minute. Your video will be shortened.");
        }
      }
      video.src = URL.createObjectURL(file);
    } else {
      setVideoDuration(null);
    }

    setSelectedFile(file);
    setMediaType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile && !videoUrlInput) {
      toast.error("Please add content, a media file, or video URL");
      return;
    }

    if (isReelMode) {
      const hasVideoFile = selectedFile && mediaType === "video";
      const hasVideoUrl = videoUrlInput.trim().length > 0;
      if (!hasVideoFile && !hasVideoUrl) {
        toast.error("Please provide a reel video or video URL");
        return;
      }
      if (selectedFile && mediaType !== "video") {
        toast.error("A reel must be a video");
        return;
      }
    }

    setIsLoading(true);

    try {
      let mediaUrl: string | null = null;
      const token = localStorage.getItem("auth_token");

      if (!selectedFile && isReelMode && videoUrlInput.trim()) {
        mediaUrl = videoUrlInput.trim();
      }

      if (!token) {
        toast.error("Authentication required");
        router.push("/auth/login");
        return;
      }

      // Step 1: Upload to Cloudinary if a file is selected
      if (selectedFile && mediaType) {
        const cloudForm = new FormData();
        cloudForm.append("file", selectedFile);
        cloudForm.append("upload_preset", "medias");

        // Folder based on type
        const folder =
          mediaType === "video"
            ? isReelMode
              ? "reels"
              : "videos"
            : mediaType === "image"
            ? "images"
            : "audio";

        cloudForm.append("folder", folder);

        if (mediaType === "video") {
          cloudForm.append("resource_type", "video");
        }
        cloudForm.append("quality", "auto");

        const uploadUrl =
          mediaType === "video"
            ? "https://api.cloudinary.com/v1_1/dskxvlrhq/video/upload"
            : mediaType === "image"
            ? "https://api.cloudinary.com/v1_1/dskxvlrhq/image/upload"
            : "https://api.cloudinary.com/v1_1/dskxvlrhq/raw/upload";

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          body: cloudForm,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload media to Cloudinary");
        }

        const uploadData = await uploadRes.json();
        mediaUrl = uploadData.secure_url;
        console.log("✅ Cloudinary upload successful:", mediaUrl);
      }

      // Step 2: Send to backend with the URL
      const endpoint = isReelMode ? ENDPOINTS.REELS : ENDPOINTS.POSTS_URL;

      // Build request body
      const requestBody: any = {
        content: content.trim() || null,
        mediaType:
          mediaType === null
            ? "text"
            : content.trim()
            ? (`text_${mediaType}` as const)
            : mediaType,
      };

      if (mediaType === "video") {
        requestBody.isReel = isReelMode;
      }

      if (mediaUrl) {
        if (mediaType === "image") requestBody.imageUrl = mediaUrl;
        else if (mediaType === "video") requestBody.videoUrl = mediaUrl;
        else if (mediaType === "audio") requestBody.audioUrl = mediaUrl;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success(`${isReelMode ? "Reel" : "Post"} created successfully!`);
        setContent("");
        setSelectedFile(null);
        setMediaType(null);
        setVideoDuration(null);
        router.push(isReelMode ? "/video" : "/home");
      } else if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("auth_token");
        router.push("/auth/login");
      } else {
        const errorMsg = responseData.message || responseData.error || "Failed to create post";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error instanceof Error ? error.message : "Error creating post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-2xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:underline mb-6"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          {/* Create Post Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="border-b border-slate-100 p-4 md:p-6 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {activeTab === "post" ? "Create Post" : "Share Reel"}
                </h1>
                <div className="flex bg-slate-200/50 p-1 rounded-xl self-start sm:self-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("post");
                    }}
                    className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                      activeTab === "post"
                        ? "bg-white shadow-sm text-[#800517] scale-100"
                        : "text-slate-500 hover:text-slate-700 active:scale-95"
                    }`}
                  >
                    Post
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("reel");
                      if (mediaType && mediaType !== "video") {
                        setSelectedFile(null);
                        setMediaType(null);
                        toast.info("Switched to Reel: Only videos allowed");
                      }
                    }}
                    className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                      activeTab === "reel"
                        ? "bg-white shadow-sm text-[#800517] scale-100"
                        : "text-slate-500 hover:text-slate-700 active:scale-95"
                    }`}
                  >
                    Reel
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Text Input */}
                <div>
                  <Textarea
                    placeholder={
                      activeTab === "post"
                        ? "What's on your mind? Share your thoughts, testimonies, or inspirations..."
                        : "Write a caption for your reel..."
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[160px] text-lg resize-none bg-transparent border-none p-0 focus-visible:ring-0 placeholder:text-slate-400 font-medium"
                  />
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {content.length} characters
                    </p>
                    {activeTab === "reel" && videoDuration && (
                      <p
                        className={`text-xs font-bold uppercase tracking-wider ${
                          videoDuration > 60 ? "text-orange-500" : "text-slate-400"
                        }`}
                      >
                        Duration: {Math.floor(videoDuration)}s{" "}
                        {videoDuration > 60 ? "(Will be shortened)" : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between group transition-all hover:bg-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                        {mediaType === "image" && <Image className="h-6 w-6 text-blue-500" />}
                        {mediaType === "video" && <Video className="h-6 w-6 text-[#800517]" />}
                        {mediaType === "audio" && <Music className="h-6 w-6 text-emerald-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 truncate max-w-[200px] md:max-w-[300px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {mediaType?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setMediaType(null);
                        setVideoDuration(null);
                      }}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-all active:scale-90"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* File Upload Buttons */}
                {!selectedFile && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeTab === "post" && (
                      <label className="cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file, "image");
                          }}
                          className="hidden"
                        />
                        <div className="flex items-center sm:flex-col justify-center gap-3 p-4 bg-[#f0f2f5] border border-transparent rounded-2xl hover:bg-[#e4e6eb] transition-all active:scale-95">
                          <div className="bg-white p-2.5 rounded-full text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                            <Image className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">Photo</span>
                        </div>
                      </label>
                    )}

                    <label
                      className={`cursor-pointer group ${
                        activeTab === "reel" ? "col-span-1 sm:col-span-3" : ""
                      }`}
                    >
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file, "video");
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center sm:flex-col justify-center gap-3 p-4 bg-[#f0f2f5] border border-transparent rounded-2xl hover:bg-[#e4e6eb] transition-all active:scale-95">
                        <div className="bg-white p-2.5 rounded-full text-[#800517] shadow-sm group-hover:scale-110 transition-transform">
                          <Video className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {activeTab === "reel" ? "Select Video" : "Video"}
                        </span>
                      </div>
                    </label>

                    {activeTab === "post" && (
                      <label className="cursor-pointer group">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file, "audio");
                          }}
                          className="hidden"
                        />
                        <div className="flex items-center sm:flex-col justify-center gap-3 p-4 bg-[#f0f2f5] border border-transparent rounded-2xl hover:bg-[#e4e6eb] transition-all active:scale-95">
                          <div className="bg-white p-2.5 rounded-full text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                            <Music className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">Audio</span>
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold bg-[#800517] hover:bg-[#600412] text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    disabled={isLoading || (!content.trim() && !selectedFile)}
                  >
                    {isLoading ? "Sharing..." : activeTab === "post" ? "Post" : "Share Reel"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
