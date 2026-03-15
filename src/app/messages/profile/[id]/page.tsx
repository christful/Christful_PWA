// app/messages/profile/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ENDPOINTS } from "@/lib/api-config";
import { formatRelativeTime } from "@/lib/date-utils";
import { 
    ChevronLeft, Users, Shield, MessageSquare, Calendar,
    Edit3, LogOut, MoreHorizontal, Image as ImageIcon,
    Music, Video, Camera, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface GroupDetails {
    group: {
        id: string;
        name: string;
        description: string;
        avatarUrl: string | null;
        communityId: string | null;
        createdBy: string;
        createdAt: string;
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            bio: string | null;
        };
        community: any | null;
        members: Array<{
            id: string;
            userId: string;
            role: string;
            createdAt: string;
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                bio: string | null;
            };
        }>;
    };
    groupChat: {
        id: string;
        messages: Array<{
            id: string;
            content: string | null;
            imageUrl: string | null;
            videoUrl: string | null;
            audioUrl: string | null;
            mediaType: string;
            createdAt: string;
            sender: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        }>;
    };
    membership: {
        id: string;
        role: string;
        joinedAt: string;
    };
    stats: {
        members: number;
        admins: number;
        messages: number;
    };
}

export default function GroupProfilePage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.id as string;

    const [groupData, setGroupData] = useState<GroupDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentUserId(localStorage.getItem("userId"));
        }
    }, []);

    useEffect(() => {
        const fetchGroupDetails = async () => {
            if (!groupId) return;
            setIsLoading(true);
            try {
                const token = localStorage.getItem("auth_token");
                const response = await fetch(ENDPOINTS.GROUP_DETAILS(groupId), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Failed to fetch group details");
                const data = await response.json();
                setGroupData(data);
            } catch (err) {
                console.error(err);
                setError("Could not load group details");
                toast.error("Failed to load group details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroupDetails();
    }, [groupId]);

    const handleAvatarClick = () => {
        if (!isAdmin) return;
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        setUploadLoading(true);
        const token = localStorage.getItem('auth_token');
        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await fetch(ENDPOINTS.GROUP_UPDATE(groupId), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Upload failed');
            }

            const updatedGroup = await response.json();
            // Update local state with new avatar URL
            setGroupData(prev => prev ? {
                ...prev,
                group: {
                    ...prev.group,
                    avatarUrl: updatedGroup.avatarUrl || updatedGroup.group?.avatarUrl,
                }
            } : null);

            toast.success('Group photo updated');
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error('Failed to update group photo');
        } finally {
            setUploadLoading(false);
            // Clear file input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleLeaveGroup = async () => {
        toast.info("Leave group coming soon");
    };

    const handleEditGroup = () => {
        toast.info("Edit group coming soon");
    };

    const handleGoToChat = () => {
        router.push(`/messages?groupId=${groupId}`);
    };

    const getMediaIcon = (type: string) => {
        switch (type) {
            case 'image': return <ImageIcon className="h-4 w-4" />;
            case 'video': return <Video className="h-4 w-4" />;
            case 'audio': return <Music className="h-4 w-4" />;
            default: return <MessageSquare className="h-4 w-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16 px-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !groupData) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16 px-4 flex items-center justify-center">
                <Card className="p-8 text-center max-w-md">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h2>
                    <p className="text-slate-600 mb-6">{error || "Group not found"}</p>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </Card>
            </div>
        );
    }

    const { group, groupChat, membership, stats } = groupData;
    const isAdmin = membership.role === 'admin';

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-10 pb-16">
            <div className="max-w-4xl mx-auto px-4">
                {/* Hidden file input for avatar upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploadLoading}
                />

                {/* Header with back button */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">Group Profile</h1>
                </div>

                <Card className="overflow-hidden mb-6 border-0 shadow-lg">
                    {/* Cover image area */}
                    <div className="relative h-48 bg-gradient-to-r from-[#800517] to-[#a0061d]">
                        {group.avatarUrl && (
                            <img
                                src={group.avatarUrl}
                                alt={group.name}
                                className="w-full h-full object-cover"
                            />
                        )}
                        {/* Camera icon for admin to change avatar */}
                        {isAdmin && !uploadLoading && (
                            <div
                                className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={handleAvatarClick}
                            >
                                <Camera className="h-5 w-5 text-[#800517]" />
                            </div>
                        )}
                        {uploadLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                        )}
                        {/* Actions moved to top right corner */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            {isAdmin && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full bg-white/90 hover:bg-white"
                                    onClick={handleEditGroup}
                                >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                size="sm"
                                className="rounded-full bg-white/90 text-red-600 hover:bg-white hover:text-red-700"
                                onClick={handleLeaveGroup}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Leave
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-white/90 hover:bg-white"
                            >
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Group info below cover */}
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-slate-900">{group.name}</h2>
                        {group.description && (
                            <p className="text-slate-600 mt-1">{group.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                            <Calendar className="h-4 w-4" />
                            <span>Created {formatRelativeTime(group.createdAt)}</span>
                            <span className="mx-2">•</span>
                            <span>by {group.creator.firstName} {group.creator.lastName}</span>
                        </div>
                    </div>
                </Card>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.members}</p>
                            <p className="text-sm text-slate-500">Members</p>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.admins}</p>
                            <p className="text-sm text-slate-500">Admins</p>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.messages}</p>
                            <p className="text-sm text-slate-500">Messages</p>
                        </div>
                    </Card>
                </div>

                {/* Members Section */}
                <Card className="p-6 mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Members ({group.members.length})
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {group.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.user.avatarUrl || undefined} />
                                        <AvatarFallback className="bg-slate-200 text-slate-700">
                                            {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            {member.user.firstName} {member.user.lastName}
                                            {member.userId === group.createdBy && (
                                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Creator</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Joined {formatRelativeTime(member.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                    {member.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : null}
                                    {member.role}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Recent Messages Preview */}
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Recent Messages
                        </h3>
                        <Button variant="ghost" size="sm" className="text-[#800517]" onClick={handleGoToChat}>
                            View All
                        </Button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {groupChat.messages.slice(0, 5).map((msg) => (
                            <div key={msg.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={msg.sender.avatarUrl || undefined} />
                                    <AvatarFallback className="bg-slate-200 text-xs">
                                        {msg.sender.firstName.charAt(0)}{msg.sender.lastName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-slate-800">
                                            {msg.sender.firstName} {msg.sender.lastName}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {formatRelativeTime(msg.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        {msg.mediaType !== 'text' && (
                                            <span className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-full">
                                                {getMediaIcon(msg.mediaType)}
                                                {msg.mediaType}
                                            </span>
                                        )}
                                        <p className="truncate">
                                            {msg.content || `[${msg.mediaType} message]`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {groupChat.messages.length === 0 && (
                            <p className="text-center text-slate-400 py-8">No messages yet</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}