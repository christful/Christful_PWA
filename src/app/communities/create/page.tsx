"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="border-b border-slate-100 p-4 md:p-6 bg-slate-50/50">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Create a New Community
              </h1>
              <p className="text-sm text-slate-500 mt-1">Build a space for believers to connect</p>
            </div>

            <div className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Community Name */}
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    Community Name
                  </label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Enter community name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-14 bg-[#f0f2f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#800517]/20 focus-visible:border-[#800517]/30 rounded-xl px-4 text-base font-medium transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    placeholder="What is this community about? Describe your vision..."
                    value={formData.description}
                    onChange={handleChange}
                    className="min-h-[140px] bg-[#f0f2f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#800517]/20 focus-visible:border-[#800517]/30 rounded-xl p-4 text-base font-medium resize-none transition-all"
                    disabled={isLoading}
                  />
                  <div className="flex justify-end items-center mt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {formData.description.length} characters
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold bg-[#800517] hover:bg-[#600412] text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    disabled={isLoading || !formData.name.trim() || !formData.description.trim()}
                  >
                    {isLoading ? "Creating..." : "Create Community"}
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
