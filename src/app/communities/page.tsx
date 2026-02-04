"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Search, Plus, Users, Globe, Settings, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/common/PostCard";

interface Community {
	id: string;
	name: string;
	description: string;
	avatarUrl?: string;
	coverUrl?: string;
	creator: {
		firstName: string;
		lastName: string;
	};
	isMember: boolean;
	members?: any[];
}

export default function CommunitiesPage() {
	const [communities, setCommunities] = useState<Community[]>([]);
	const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchCommunities();
	}, []);

	const fetchCommunities = async () => {
		try {
			const token = localStorage.getItem("auth_token");
			const response = await fetch(`${ENDPOINTS.COMMUNITIES}?limit=20`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				const comms = data.communities || [];
				setCommunities(comms);
				if (comms.length > 0) {
					setSelectedCommunity(comms[0]);
				}
			}
		} catch (error) {
			console.error("Error fetching communities:", error);
			toast.error("Failed to load communities");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = async (query: string) => {
		setSearchQuery(query);
		if (!query.trim()) {
			fetchCommunities();
			return;
		}

		try {
			const token = localStorage.getItem("auth_token");
			if (!token) {
				toast.error("Please login first");
				return;
			}

			const response = await fetch(
				`${ENDPOINTS.COMMUNITY_SEARCH}?q=${query}&limit=20`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.ok) {
				const data = await response.json();
				setCommunities(data.communities || []);
			}
		} catch (error) {
			console.error("Error searching:", error);
			toast.error("Search failed");
		}
	};

	const handleJoinCommunity = async (communityId: string) => {
		try {
			const token = localStorage.getItem("auth_token");
			const response = await fetch(ENDPOINTS.JOIN_COMMUNITY(communityId), {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				toast.success("Joined community successfully!");
				fetchCommunities();
			}
		} catch (error) {
			console.error("Error joining community:", error);
			toast.error("Failed to join community");
		}
	};

	const CommunityList = () => (
		<div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
			<div className="p-4 border-b">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Communities</h2>
					<Link href="/communities/create">
						<Button variant="ghost" size="icon" className="bg-slate-100 rounded-full">
							<Plus size={20} />
						</Button>
					</Link>
				</div>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search groups"
						className="pl-10 rounded-full bg-slate-100 border-none h-10"
						value={searchQuery}
						onChange={(e) => handleSearch(e.target.value)}
					/>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				) : (
					communities.map((community) => (
						<div
							key={community.id}
							onClick={() => setSelectedCommunity(community)}
							className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 transition-colors ${selectedCommunity?.id === community.id ? "bg-slate-50" : ""
								}`}
						>
							<Avatar className="h-12 w-12 rounded-lg">
								<AvatarImage src={community.avatarUrl} className="object-cover" />
								<AvatarFallback className="bg-slate-200 rounded-lg">
									{community.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold truncate">{community.name}</h3>
								<p className="text-slate-500 text-xs">
									Last active 2 hours ago
								</p>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);

	const CommunityFeed = () => (
		<div className="space-y-4">
			{selectedCommunity ? (
				<>
					{/* Community Header Card */}
					<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
						<div className="h-48 bg-slate-200 relative">
							{selectedCommunity.coverUrl && (
								<img src={selectedCommunity.coverUrl} className="w-full h-full object-cover" />
							)}
							<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-20">
								<h2 className="text-white text-2xl font-bold">{selectedCommunity.name}</h2>
								<div className="flex items-center gap-2 text-white/80 text-sm mt-1">
									<Globe size={14} />
									<span>Public Group</span>
									<span>•</span>
									<span>{selectedCommunity.members?.length || 0} members</span>
								</div>
							</div>
						</div>
						<div className="p-4 flex items-center justify-between border-t">
							<div className="flex -space-x-2">
								{[1, 2, 3, 4, 5].map((i) => (
									<Avatar key={i} className="h-8 w-8 border-2 border-white">
										<AvatarFallback className="text-[10px] bg-slate-200">U{i}</AvatarFallback>
									</Avatar>
								))}
							</div>
							<div className="flex gap-2">
								{selectedCommunity.isMember ? (
									<Button className="bg-[#800517]">Invited</Button>
								) : (
									<Button
										className="bg-primary"
										onClick={() => handleJoinCommunity(selectedCommunity.id)}
									>
										Join Group
									</Button>
								)}
								<Button variant="outline" size="icon"><Settings size={20} /></Button>
							</div>
						</div>
					</div>

					{/* Feed (Dummy Data) */}
					<div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
						<div className="flex gap-3">
							<Avatar>
								<AvatarFallback>Me</AvatarFallback>
							</Avatar>
							<div className="flex-1">
								<Input
									placeholder={`Write something to ${selectedCommunity.name}...`}
									className="rounded-full bg-slate-100 border-none"
								/>
							</div>
						</div>
					</div>

					{/* Post Placeholder */}
					<PostCard
						postId="1"
						postType="text"
						authorId="1"
						authorName={`${selectedCommunity.creator.firstName} ${selectedCommunity.creator.lastName}`}
						authorAvatar=""
						date={new Date().toLocaleDateString()}
						textContent="Welcome to our community! Let us share the love of Christ together. 🙏✨"
						likesCount={0}
						commentsCount={0}
					/>
				</>
			) : (
				<div className="bg-white rounded-lg p-12 text-center text-slate-400 border">
					<Users size={64} className="mx-auto mb-4 opacity-20" />
					<p>Select a community to view details</p>
				</div>
			)}
		</div>
	);

	const CommunityDetails = () => (
		<div className="space-y-4">
			{selectedCommunity ? (
				<>
					<div className="bg-white rounded-lg shadow-sm border p-4">
						<h3 className="font-bold text-lg mb-4">About</h3>
						<p className="text-sm text-slate-600 mb-4">{selectedCommunity.description}</p>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<Globe size={18} className="text-slate-400 mt-1" />
								<div>
									<p className="text-sm font-semibold">Public</p>
									<p className="text-xs text-slate-500">Anyone can see who's in the group and what they post.</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<Users size={18} className="text-slate-400 mt-1" />
								<div>
									<p className="text-sm font-semibold">Visible</p>
									<p className="text-xs text-slate-500">Anyone can find this group.</p>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border p-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Members</h3>
							<Button variant="link" className="text-primary text-sm p-0">See all</Button>
						</div>
						<div className="grid grid-cols-4 gap-2">
							{[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
								<div key={i} className="flex flex-col items-center">
									<Avatar className="h-10 w-10">
										<AvatarFallback>U{i}</AvatarFallback>
									</Avatar>
									<span className="text-[10px] text-slate-400 mt-1">User {i}</span>
								</div>
							))}
						</div>
					</div>
				</>
			) : (
				<p className="text-slate-400 text-center mt-20">No details available</p>
			)}
		</div>
	);

	return (
		<div className="min-h-screen bg-[#F0F2F5] pb-20 md:pb-0">
			<Header />
			<PageGrid
				left={<CommunityList />}
				center={<CommunityFeed />}
				right={<CommunityDetails />}
			/>
			<BottomNav />
		</div>
	);
}
