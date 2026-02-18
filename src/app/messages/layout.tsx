"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { ENDPOINTS } from "@/lib/api-config";
import { useApi } from "@/hooks/use-api";
import { ChatList } from "@/components/features/messages/ChatList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface GroupChat {
    id: string;
    name: string;
    lastMessage?: string;
    lastMessageTime?: string;
    profileImageUrl?: string | null;
    coverImageUrl?: string | null;
    members: any[];
    communityId?: string;
    communityName?: string;
}

export default function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDescription, setNewGroupDescription] = useState("");
    const [newGroupAvatar, setNewGroupAvatar] = useState<File | null>(null);

    const params = useParams();
    const selectedId = params.id as string;

    const { data: recentMessagesData, isLoading: chatsLoading, mutate: mutateGroups } = useApi<{ groups: GroupChat[] }>(
        ENDPOINTS.GROUPS_WITH_RECENT_MESSAGES,
        { refreshInterval: 30000 }
    );

    const groupChats = recentMessagesData?.groups || [];

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            toast.error("Group name is required");
            return;
        }
        try {
            const token = localStorage.getItem("auth_token");
            const formData = new FormData();
            formData.append("name", newGroupName);
            formData.append("description", newGroupDescription);
            if (newGroupAvatar) {
                formData.append("avatar", newGroupAvatar);
            }

            const response = await fetch(ENDPOINTS.GROUPS, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });
            if (response.ok) {
                toast.success("Group created successfully!");
                setIsCreateModalOpen(false);
                setNewGroupName("");
                setNewGroupDescription("");
                setNewGroupAvatar(null);
                mutateGroups();
            } else {
                toast.error("Failed to create group");
            }
        } catch (error) {
            console.error("Error creating group:", error);
            toast.error("An error occurred");
        }
    };

    const filteredChats = groupChats.filter((chat: any) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[#F0F2F5] h-dvh flex flex-col overflow-hidden pb-16 md:pb-0 pt-16 md:pt-20">
            <Header />

            <div className="flex-1 min-h-0 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                    {/* Chat List - Left Column */}
                    <div className={`${selectedId ? "hidden md:block" : "block"} md:col-span-1 h-full`}>
                        <ChatList
                            chats={filteredChats}
                            isLoading={chatsLoading}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            onOpenCreateModal={() => setIsCreateModalOpen(true)}
                        />
                    </div>

                    {/* Chat Content - Right Column */}
                    <div className={`${!selectedId ? "hidden md:block" : "block"} md:col-span-2 min-h-0 overflow-auto`}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">New Group</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} className="rounded-full">
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Group Name</label>
                                <Input
                                    placeholder="e.g. Prayer Warriors"
                                    className="rounded-xl bg-slate-50 border-slate-200 h-12 focus-visible:ring-[#800517]"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#800517] min-h-[80px] transition-all"
                                    placeholder="What is this group about?"
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Group Avatar</label>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                        {newGroupAvatar ? (
                                            <img src={URL.createObjectURL(newGroupAvatar)} className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="text-slate-300" />
                                        )}
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setNewGroupAvatar(e.target.files?.[0] || null)}
                                        className="flex-1 rounded-xl bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-8">
                                <Button variant="ghost" className="rounded-full px-6" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button className="bg-[#800517] hover:bg-[#a0061d] rounded-full px-8 font-bold shadow-lg shadow-red-100" onClick={handleCreateGroup}>Create Group</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
