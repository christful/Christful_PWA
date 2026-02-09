"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

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
    if (activeTab === "reel" && type !== "video") {
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
        if (activeTab === "reel" && duration > 60) {
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
    if (!content.trim() && !selectedFile) {
      toast.error("Please add content or a file");
      return;
    }

    if (activeTab === "reel" && mediaType !== "video") {
      toast.error("A reel must be a video");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Authentication required");
        router.push("/auth/login");
        return;
      }

      const formData = new FormData();
      formData.append("content", content);
      formData.append("type", activeTab);

      if (selectedFile && mediaType) {
        formData.append(mediaType, selectedFile);
        // Note: Backend should handle the actual clipping if duration > 60
        if (activeTab === "reel") {
          formData.append("isReel", "true");
        }
      }

      const endpoint = activeTab === "reel" ? ENDPOINTS.REELS : ENDPOINTS.POSTS;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Post response status:", response.status);

      const responseText = await response.text();
      console.log("Post response body:", responseText);

      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log("Could not parse response as JSON");
      }

      if (response.ok) {
        toast.success(`${activeTab === 'post' ? 'Post' : 'Reel'} created successfully!`);
        setContent("");
        setSelectedFile(null);
        setMediaType(null);
        setVideoDuration(null);
        router.push(activeTab === 'post' ? "/home" : "/video");
      } else if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("auth_token");
        router.push("/auth/login");
      } else {
        console.error("Post creation error:", response.status, responseData);
        const errorMsg = (responseData as any)?.message || (responseData as any)?.error || "Failed to create post";
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
          <Card className="shadow-sm border-none md:border md:block">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>{activeTab === "post" ? "Create a New Post" : "Share a Reel"}</CardTitle>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => {
                      setActiveTab("post");
                      if (mediaType !== "video") {
                        // Keep selection if it's already compatible or reset if needed
                      }
                    }}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === "post" ? "bg-white shadow-sm text-[#800517]" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Post
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("reel");
                      if (mediaType && mediaType !== "video") {
                        setSelectedFile(null);
                        setMediaType(null);
                        toast.info("Switched to Reel: Only videos allowed");
                      }
                    }}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === "reel" ? "bg-white shadow-sm text-[#800517]" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Reel
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Text Input */}
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    {activeTab === "post" ? "What's on your mind?" : "Caption for your reel"}
                  </label>
                  <Textarea
                    placeholder={activeTab === "post" ? "Share your thoughts, testimonies, or inspirations..." : "Describe your reel..."}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-32 resize-none bg-slate-50 border-none rounded-xl p-4 focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] items-center flex font-bold text-slate-400 uppercase tracking-wider">
                      {content.length} characters
                    </p>
                    {activeTab === "reel" && videoDuration && (
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${videoDuration > 60 ? 'text-orange-500' : 'text-slate-400'}`}>
                        Duration: {Math.floor(videoDuration)}s {videoDuration > 60 ? '(Will be shortened)' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        {mediaType === "image" && (
                          <Image className="h-5 w-5 text-blue-500" />
                        )}
                        {mediaType === "video" && (
                          <Video className="h-5 w-5 text-[#800517]" />
                        )}
                        {mediaType === "audio" && (
                          <Music className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-700 truncate max-w-[200px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs font-medium text-slate-400">
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
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* File Upload Buttons */}
                <div className="grid grid-cols-3 gap-3">
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
                      <div className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group-hover:scale-[1.02]">
                        <Image className="h-6 w-6 text-blue-500" />
                        <span className="text-xs font-bold text-slate-600">Photo</span>
                      </div>
                    </label>
                  )}

                  <label className={`cursor-pointer group ${activeTab === "reel" ? "col-span-3" : ""}`}>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "video");
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group-hover:scale-[1.02]">
                      <Video className="h-6 w-6 text-[#800517]" />
                      <span className="text-xs font-bold text-slate-600">{activeTab === "reel" ? "Select Reel Video" : "Video"}</span>
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
                      <div className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group-hover:scale-[1.02]">
                        <Music className="h-6 w-6 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-600">Audio</span>
                      </div>
                    </label>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-[#800517] hover:bg-[#a0061d] shadow-md hover:shadow-lg transition-all rounded-xl"
                  disabled={isLoading || (!content.trim() && !selectedFile)}
                >
                  {isLoading ? "Sharing..." : activeTab === "post" ? "Create Post" : "Post Reel"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}