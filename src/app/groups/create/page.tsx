"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.GROUPS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isPrivate: false, // Defaulting to public for now
        }),
      });

      if (response.ok) {
        toast.success("Group created successfully!");
        const data = await response.json();
        // Redirect to new group or groups list
        router.push(`/groups/${data.id || ""}`); // Fallback to groups list if id missing
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("An error occurred while creating the group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-xl mx-auto px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:underline mb-6"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          <Card>
            <CardHeader>
              <CardTitle>Create a New Group</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Prayer Warriors"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this group about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
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
