"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ENDPOINTS } from "@/lib/api-config";
import { toast } from "sonner";
import { Search, Plus, Users } from "lucide-react";
import Link from "next/link";

interface Community {
	id: string;
	name: string;
	description: string;
	avatarUrl?: string;
	creator: {
		firstName: string;
		lastName: string;
	};
	isMember: boolean;
	members?: any[];
}

export default function CommunitiesPage() {
	const [communities, setCommunities] = useState<Community[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchCommunities();
	}, []);

	const fetchCommunities = async () => {
		try {
			const token = localStorage.getItem("auth_token");
			const response = await fetch(
				`${ENDPOINTS.COMMUNITIES}?limit=20`,
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

	return (
		<div className="min-h-screen bg-white">
			{/* WhatsApp-style Header */}
			<div className="fixed top-0 left-0 right-0 z-10 bg-[#075E54] text-white shadow-md">
				<div className="flex items-center justify-between px-4 h-[60px] max-w-4xl mx-auto">
					<h1 className="text-xl font-bold">Communities</h1>
					<div className="flex items-center gap-4">
						<Search className="h-5 w-5 cursor-pointer" />
						<Link href="/communities/create">
							<Plus className="h-6 w-6 cursor-pointer" />
						</Link>
					</div>
				</div>
				{/* Tabs or Sub-header could go here */}
			</div>

			<div className="pt-[60px] pb-20 md:pb-0">
				<div className="max-w-4xl mx-auto">
					{/* Search Bar - Optional, maybe keep hidden behind icon for true WhatsApp feel, 
                        but inline is better for web usability */}
					<div className="p-3 bg-white border-b">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search communities..."
								className="pl-10 rounded-lg bg-slate-100 border-none h-10 focus-visible:ring-1 focus-visible:ring-[#075E54]"
								value={searchQuery}
								onChange={(e) => handleSearch(e.target.value)}
							/>
						</div>
					</div>

					{/* Communities List */}
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#075E54]"></div>
						</div>
					) : communities.length > 0 ? (
						<div className="bg-white">
							{communities.map((community) => (
								<Link
									key={community.id}
									href={`/communities/${community.id}`}
								>
									<div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100">
										<Avatar className="h-12 w-12 flex-shrink-0">
											<AvatarImage
												src={community.avatarUrl}
												alt={community.name}
												className="object-cover"
											/>
											<AvatarFallback className="bg-slate-200 text-slate-500 font-medium text-lg">
												{community.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>

										<div className="flex-1 min-w-0">
											<div className="flex justify-between items-baseline mb-1">
												<h3 className="font-semibold text-slate-900 truncate text-[17px]">
													{community.name}
												</h3>
												{/* We don't have a 'last active' time for community generally, maybe member count? */}
												<span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
													{community.members?.length || 0} members
												</span>
											</div>
											<div className="flex justify-between items-center gap-2">
												<p className="text-slate-500 text-sm truncate leading-5 flex-1">
													{community.description}
												</p>
												{!community.isMember && (
													<Button
														size="sm"
														variant="ghost"
														className="h-7 text-[#075E54] hover:text-[#128C7E] px-2 text-xs font-bold uppercase"
														onClick={(e) => {
															e.preventDefault();
															handleJoinCommunity(community.id);
														}}
													>
														Join
													</Button>
												)}
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<p className="text-muted-foreground">
								No communities found
							</p>
						</div>
					)}
				</div>
			</div>

			<BottomNav />
		</div>
	);
}