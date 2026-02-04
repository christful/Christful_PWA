"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
	const router = useRouter();
	const [communities, setCommunities] = useState<Community[]>([]);
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

	const CommunityListSidebar = () => (
		<div className="bg-white rounded-xl shadow-sm border h-full flex flex-col overflow-hidden">
			<div className="p-5 border-b">
				<div className="flex justify-between items-center mb-5">
					<h2 className="text-2xl font-bold text-slate-900">Communities</h2>
					<Link href="/communities/create">
						<Button variant="ghost" size="icon" className="bg-slate-100 rounded-full hover:bg-[#800517] hover:text-white transition-all">
							<Plus size={20} />
						</Button>
					</Link>
				</div>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search groups"
						className="pl-10 rounded-full bg-slate-100 border-none h-11 focus-visible:ring-[#800517]"
						value={searchQuery}
						onChange={(e) => handleSearch(e.target.value)}
					/>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto p-2">
				<div className="space-y-1">
					<Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-lg bg-slate-50 text-[#800517]">
						<div className="bg-[#800517] text-white p-2 rounded-lg">
							<Users size={18} />
						</div>
						<span className="font-semibold">Your Feed</span>
					</Button>
					<Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-lg hover:bg-slate-50">
						<div className="bg-slate-200 text-slate-600 p-2 rounded-lg">
							<Globe size={18} />
						</div>
						<span className="font-semibold">Discover</span>
					</Button>
				</div>

				<div className="mt-6">
					<h3 className="px-3 text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Your Communities</h3>
					{isLoading ? (
						<div className="py-4 flex justify-center"><div className="animate-spin h-5 w-5 border-2 border-[#800517] border-t-transparent rounded-full"></div></div>
					) : (
						communities.filter(c => c.isMember).map((community) => (
							<Link key={community.id} href={`/communities/${community.id}`}>
								<div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors group">
									<Avatar className="h-10 w-10 rounded-lg border">
										<AvatarImage src={community.avatarUrl} className="object-cover" />
										<AvatarFallback className="bg-slate-200 text-slate-500 text-sm">
											{community.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<span className="font-medium text-slate-700 truncate group-hover:text-[#800517]">{community.name}</span>
								</div>
							</Link>
						))
					)}
				</div>
			</div>
		</div>
	);

	const DiscoveryCenter = () => (
		<div className="space-y-6">
			{/* Featured/Hero Area */}
			<div className="bg-gradient-to-br from-[#800517] to-[#a0061d] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
				<div className="relative z-10 max-w-lg">
					<h2 className="text-3xl font-bold mb-3">Find Your Spiritual Family</h2>
					<p className="text-white/80 mb-6">Join faith-centered communities to grow, share, and connect with believers worldwide.</p>
					<Link href="/communities/create">
						<Button className="bg-white text-[#800517] hover:bg-slate-100 font-bold px-6 rounded-full h-11">
							Create Your Own Community
						</Button>
					</Link>
				</div>
				<Users size={200} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
			</div>

			{/* Your Communities Section */}
			{communities.filter(c => c.isMember).length > 0 && (
				<div className="bg-white p-6 rounded-2xl shadow-sm border">
					<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
						<Users className="text-[#800517]" size={20} />
						Your Communities
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{communities.filter(c => c.isMember).map(community => (
							<Link key={community.id} href={`/communities/${community.id}`}>
								<div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
									<Avatar className="h-12 w-12 rounded-lg">
										<AvatarImage src={community.avatarUrl} className="object-cover" />
										<AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
									</Avatar>
									<div className="truncate">
										<div className="font-bold text-slate-800 truncate group-hover:text-[#800517]">{community.name}</div>
										<div className="text-[10px] text-slate-500">Member since recently</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Lists */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-white p-6 rounded-2xl shadow-sm border">
					<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
						<Users className="text-[#800517]" size={20} />
						Popular Communities
					</h3>
					<div className="space-y-4">
						{communities.slice(0, 5).map(community => (
							<div key={community.id} className="flex items-center gap-4 justify-between">
								<Link href={`/communities/${community.id}`} className="flex items-center gap-3 flex-1 min-w-0">
									<Avatar className="h-11 w-11 rounded-full border">
										<AvatarImage src={community.avatarUrl} />
										<AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
									</Avatar>
									<div className="truncate">
										<div className="font-semibold text-slate-800 truncate">{community.name}</div>
										<div className="text-xs text-slate-500">{community.members?.length || 0} members</div>
									</div>
								</Link>
								<Button
									size="sm"
									variant={community.isMember ? "outline" : "default"}
									className={community.isMember ? "" : "bg-[#800517] text-white hover:bg-[#a0061d]"}
									onClick={() => !community.isMember && handleJoinCommunity(community.id)}
								>
									{community.isMember ? "Joined" : "Join"}
								</Button>
							</div>
						))}
					</div>
				</div>

				<div className="bg-white p-6 rounded-2xl shadow-sm border">
					<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
						<Globe className="text-[#800517]" size={20} />
						Suggested For You
					</h3>
					<div className="space-y-4">
						{communities.slice(5, 10).map(community => (
							<div key={community.id} className="flex items-center gap-4 justify-between">
								<Link href={`/communities/${community.id}`} className="flex items-center gap-3 flex-1 min-w-0">
									<Avatar className="h-11 w-11 rounded-full border">
										<AvatarImage src={community.avatarUrl} />
										<AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
									</Avatar>
									<div className="truncate">
										<div className="font-semibold text-slate-800 truncate">{community.name}</div>
										<div className="text-xs text-slate-500">{community.members?.length || 0} members</div>
									</div>
								</Link>
								<Button
									size="sm"
									variant={community.isMember ? "outline" : "default"}
									className={community.isMember ? "" : "bg-[#800517] text-white hover:bg-[#a0061d]"}
									onClick={() => !community.isMember && handleJoinCommunity(community.id)}
								>
									{community.isMember ? "Joined" : "Join"}
								</Button>
							</div>
						))}
						{communities.length < 5 && (
							<div className="text-center py-10">
								<p className="text-slate-400 text-sm">No suggestions right now</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	const CommunityActivitySidebar = () => (
		<div className="space-y-6">
			<div className="bg-white p-5 rounded-xl shadow-sm border">
				<h3 className="font-bold text-lg mb-4 text-slate-800">Recent Activity</h3>
				<div className="space-y-4">
					{[1, 2, 3].map(i => (
						<div key={i} className="flex gap-3">
							<Avatar className="h-8 w-8">
								<AvatarFallback>U{i}</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-sm text-slate-600">
									<span className="font-semibold text-slate-800 text-xs">Mervin James</span> posted in <span className="font-semibold text-[#800517] text-xs">Prayer Warriors</span>
								</p>
								<p className="text-[10px] text-slate-400 mt-0.5">20 minutes ago</p>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="bg-white p-5 rounded-xl shadow-sm border">
				<h3 className="font-bold text-lg mb-4 text-slate-800">Top Contributors</h3>
				<div className="flex -space-x-2 mb-4">
					{[1, 2, 3, 4, 5].map(i => (
						<Avatar key={i} className="h-10 w-10 border-2 border-white">
							<AvatarFallback className="bg-[#800517] text-white text-xs">U{i}</AvatarFallback>
						</Avatar>
					))}
					<div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border-2 border-white">+12</div>
				</div>
				<p className="text-xs text-slate-500">Weekly spiritual leaders in our community base.</p>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-[#F0F2F5]">
			<Header />
			<PageGrid
				left={<CommunityListSidebar />}
				center={<DiscoveryCenter />}
				right={<CommunityActivitySidebar />}
			/>
			<BottomNav />
		</div>
	);
}
