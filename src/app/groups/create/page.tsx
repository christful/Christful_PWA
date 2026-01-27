"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export default function CreateGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get("communityId");
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Group description is required");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please login first");
        router.push("/auth/login");
        return;
      }

      const body: any = {
        name: name.trim(),
        description: description.trim(),
      };

      // Add communityId if this is creating a group within a community
      if (communityId) {
        body.communityId = communityId;
      }

      console.log("Creating group with data:", body);

      const response = await fetch(ENDPOINTS.GROUPS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();
      console.log("Response:", responseData);

      if (response.ok) {
        toast.success("Group created successfully!");
        
        // Wait a moment before redirecting to ensure server has processed
        setTimeout(() => {
          if (communityId) {
            router.push(`/communities/${communityId}`);
          } else {
            router.push("/groups");
          }
        }, 500);
      } else {
        toast.error(responseData.message || "Failed to create group");
        console.error("Error response:", responseData);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Error creating group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBFDFF] via-[#F0E6FF] to-[#FFE6E6] pb-20 md:pb-0">
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

          {/* Create Group Card */}
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
              <CardTitle className="text-2xl">
                Create a New {communityId ? "Community Group" : "Group"}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Group Name */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Group Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter group name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Describe your group..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-32 resize-none"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !name.trim() || !description.trim()}
                >
                  {isLoading ? "Creating..." : "Create Group"}
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
