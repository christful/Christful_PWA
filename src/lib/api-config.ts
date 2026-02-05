export const API_BASE_URL = "https://christful-backend.vercel.app";

export const ENDPOINTS = {
    // Auth
    LOGIN: `${API_BASE_URL}/login`,
    REGISTER: `${API_BASE_URL}/register`,
    GOOGLE_OAUTH: `${API_BASE_URL}/google-auth`,
    RESET_PASSWORD: `${API_BASE_URL}/reset-password`,
    FORGOT_PASSWORD: `${API_BASE_URL}/forgot-password`,
    ME: `${API_BASE_URL}/auth/me`,
    PROFILE: `${API_BASE_URL}/profile`,

    // Users
    USERS: `${API_BASE_URL}/users`,
    USER_DETAIL: (userId: string) => `${API_BASE_URL}/users/${userId}`,
    FOLLOW: (userId: string) => `${API_BASE_URL}/users/${userId}/follow`,
    FOLLOWERS: (userId: string) => `${API_BASE_URL}/users/${userId}/followers`,
    FOLLOWING: (userId: string) => `${API_BASE_URL}/users/${userId}/following`,
    FOLLOW_STATUS: (userId: string) => `${API_BASE_URL}/users/${userId}/follow-status`,

    // Posts & Reels
    POSTS: `${API_BASE_URL}/posts`,
    POST_DETAIL: (postId: string) => `${API_BASE_URL}/posts/${postId}`,
    LIKE_POST: (postId: string) => `${API_BASE_URL}/posts/${postId}/like`,
    REELS: `${API_BASE_URL}/reels`,
    SUGGESTED_REELS: `${API_BASE_URL}/reels/suggested`,

    // Comments
    COMMENTS: (postId: string) => `${API_BASE_URL}/posts/${postId}/comments`,
    COMMENT_DETAIL: (commentId: string) => `${API_BASE_URL}/comments/${commentId}`,
    COMMENT_REPLIES: (commentId: string) => `${API_BASE_URL}/comments/${commentId}/replies`,
    LIKE_COMMENT: (commentId: string) => `${API_BASE_URL}/comments/${commentId}/like`,

    // Communities
    COMMUNITIES: `${API_BASE_URL}/communities`,
    SUGGESTED_COMMUNITIES: `${API_BASE_URL}/communities/suggested`,
    COMMUNITY_DETAIL: (communityId: string) => `${API_BASE_URL}/communities/${communityId}`,
    COMMUNITY_GROUPS: (communityId: string) => `${API_BASE_URL}/communities/${communityId}/groups`,
    JOIN_COMMUNITY: (id: string) => `${API_BASE_URL}/communities/${id}/join`,
    LEAVE_COMMUNITY: (communityId: string) => `${API_BASE_URL}/communities/${communityId}/leave`,
    COMMUNITY_SEARCH: `${API_BASE_URL}/communities/search`,
    COMMUNITY_JOIN_REQUESTS: (communityId: string) => `${API_BASE_URL}/communities/${communityId}/join-requests`,

    // Groups
    GROUPS: `${API_BASE_URL}/groups`,
    GROUP_DETAIL: (groupId: string) => `${API_BASE_URL}/groups/${groupId}`,
    GROUP_MESSAGES: (groupId: string) => `${API_BASE_URL}/groups/${groupId}/messages`,
    GENERATE_INVITE: (groupId: string) => `${API_BASE_URL}/groups/${groupId}/invite-link`,
    JOIN_GROUP_LINK: `${API_BASE_URL}/groups/join-via-link`,
    ADMIN_ONLY_MESSAGING: (groupId: string) => `${API_BASE_URL}/groups/${groupId}/settings/admin-only-messaging`,

    // Messaging
    REACT_MESSAGE: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/react`,

    // Notifications
    NOTIFICATIONS: `${API_BASE_URL}/notifications`,
    READ_NOTIFICATION: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    READ_ALL_NOTIFICATIONS: `${API_BASE_URL}/notifications/read-all`,
};
