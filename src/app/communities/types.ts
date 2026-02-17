export interface Group {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string | null;
  createdAt: string;
  members?: Array<{
    id: string;
    userId: string;
    groupId: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  }>;
  isJoined?: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string | null;
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
