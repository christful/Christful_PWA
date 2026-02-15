export interface Group {
  id: string;
  name: string;
  description: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  createdAt: string;
  membersCount?: number;
  isJoined?: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  isPrivate: boolean;
  createdAt: string;
  createdBy: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  memberships: Array<{
    id: string;
    userId: string;
    role: string;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
    };
  }>;
  groups?: Group[];
  stats?: {
    membersCount: number;
    groupsCount: number;
    postsCount: number;
  };
}
