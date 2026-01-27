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
    setSelectedFile(file);
    setMediaType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) {
      toast.error("Please add content or a file");
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

      if (selectedFile && mediaType) {
        formData.append(mediaType, selectedFile);
      }

      const response = await fetch(ENDPOINTS.POSTS, {
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
        toast.success("Post created successfully!");
        setContent("");
        setSelectedFile(null);
        setMediaType(null);
        router.push("/home");
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
          <Card>
            <CardHeader>
              <CardTitle>Create a New Post</CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Text Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What's on your mind?
                  </label>
                  <Textarea
                    placeholder="Share your thoughts, testimonies, or inspirations..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-32 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {content.length} characters
                  </p>
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="p-4 bg-secondary rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {mediaType === "image" && (
                        <Image className="h-5 w-5" />
                      )}
                      {mediaType === "video" && (
                        <Video className="h-5 w-5" />
                      )}
                      {mediaType === "audio" && (
                        <Music className="h-5 w-5" />
                      )}
                      <div>
                        <p className="font-semibold text-sm">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setMediaType(null);
                      }}
                      className="text-destructive hover:bg-destructive/10 p-2 rounded"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* File Upload Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "image");
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 p-3 border border-input rounded-lg hover:bg-secondary transition-colors">
                      <Image className="h-5 w-5" />
                      <span className="text-sm font-medium">Image</span>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "video");
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 p-3 border border-input rounded-lg hover:bg-secondary transition-colors">
                      <Video className="h-5 w-5" />
                      <span className="text-sm font-medium">Video</span>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "audio");
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 p-3 border border-input rounded-lg hover:bg-secondary transition-colors">
                      <Music className="h-5 w-5" />
                      <span className="text-sm font-medium">Audio</span>
                    </div>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || (!content.trim() && !selectedFile)}
                >
                  {isLoading ? "Creating..." : "Create Post"}
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