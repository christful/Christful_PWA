"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Search, Plus, Users, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  description: string;
  userRole: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  members?: any[];
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(ENDPOINTS.GROUPS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">My Groups</h1>
            <Link href="/groups/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </Link>
          </div>

          {/* Search Section */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-10 rounded-full h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Groups Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Created by {group.creator.firstName}{" "}
                        {group.creator.lastName}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {group.members?.length || 0} members
                      </div>

                      <Button className="w-full gap-2" size="sm">
                        <MessageSquare className="h-4 w-4" />
                        Open Chat
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No groups found" : "You haven't joined any groups yet"}
              </p>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}