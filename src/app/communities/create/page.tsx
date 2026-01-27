"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export default function CreateCommunityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Community name is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Community description is required");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.COMMUNITIES, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });

      if (response.ok) {
        toast.success("Community created successfully!");
        setFormData({ name: "", description: "" });
        router.push("/communities");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create community");
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Error creating community");
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

          {/* Create Community Card */}
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
              <CardTitle className="text-2xl">Create a New Community</CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Community Name */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Community Name
                  </label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Enter community name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    placeholder="Describe your community..."
                    value={formData.description}
                    onChange={handleChange}
                    className="min-h-32 resize-none"
                    disabled={isLoading}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !formData.name.trim() || !formData.description.trim()}
                >
                  {isLoading ? "Creating..." : "Create Community"}
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
