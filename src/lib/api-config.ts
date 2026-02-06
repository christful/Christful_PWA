export const API_BASE_URL = "https://christful-backend.vercel.app";

export const ENDPOINTS = {
    // Basic
    WELCOME: `${API_BASE_URL}/`,
    SEND_WELCOME_EMAIL: `${API_BASE_URL}/sendemail`,

    // Auth
    LOGIN: `${API_BASE_URL}/login`,
    REGISTER: `${API_BASE_URL}/register`,
    GOOGLE_AUTH: `${API_BASE_URL}/google-auth`,
    AUTH_ME: `${API_BASE_URL}/auth/me`,
    FORGOT_PASSWORD: `${API_BASE_URL}/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/reset-password`,

    // User Profiles
    USER: `${API_BASE_URL}/user`,
    PROFILE: `${API_BASE_URL}/profile`, // Alias for /user
    USERS: `${API_BASE_URL}/users`,
    USER_DETAIL: (userId: string) => `${API_BASE_URL}/users/${userId}`,

    // Follow System
    FOLLOW: (userId: string) => `${API_BASE_URL}/users/${userId}/follow`,
    FOLLOWERS: (userId: string) => `${API_BASE_URL}/users/${userId}/followers`,
    FOLLOWING: (userId: string) => `${API_BASE_URL}/users/${userId}/following`,
    FOLLOW_STATUS: (userId: string) => `${API_BASE_URL}/users/${userId}/follow-status`,

    // Posts
    POSTS: `${API_BASE_URL}/posts`,
    POST_DETAIL: (postId: string) => `${API_BASE_URL}/posts/${postId}`,
    LIKE_POST: (postId: string) => `${API_BASE_URL}/posts/${postId}/like`,

    // Reels
    REELS: `${API_BASE_URL}/reels`,
    SUGGESTED_REELS: `${API_BASE_URL}/reels/suggested`,

    // Comments
    COMMENTS: (postId: string) => `${API_BASE_URL}/posts/${postId}/comments`,
    COMMENT_DETAIL: (commentId: string) => `${API_BASE_URL}/comments/${commentId}`,
    COMMENT_REPLIES: (commentId: string) => `${API_BASE_URL}/comments/${commentId}/replies`,
    COMMENT_THREAD: (commentId: string) => `${API_BASE_URL}/comments/${commentId}/thread`,
    LIKE_COMMENT: (commentId: string) => `${API_BASE_URL}/comments/${commentId}/like`,

    // Communities
    COMMUNITIES: `${API_BASE_URL}/communities`,
    COMMUNITY_SEARCH: `${API_BASE_URL}/communities/search`,
    COMMUNITY_SUGGESTED: `${API_BASE_URL}/communities/suggested`,
    COMMUNITY_DETAIL: (communityId: string) => `${API_BASE_URL}/communities/${communityId}`,
    COMMUNITY_JOIN: (id: string) => `${API_BASE_URL}/communities/${id}/join`,
    COMMUNITY_LEAVE: (id: string) => `${API_BASE_URL}/communities/${id}/leave`,
    COMMUNITY_REQUEST_JOIN: (id: string) => `${API_BASE_URL}/communities/${id}/request-join`,
    COMMUNITY_JOIN_REQUESTS: (communityId: string) => `${API_BASE_URL}/communities/${communityId}/join-requests`,
    APPROVE_JOIN_REQUEST: (communityId: string, requestId: string) => `${API_BASE_URL}/communities/${communityId}/join-requests/${requestId}/approve`,
    REJECT_JOIN_REQUEST: (communityId: string, requestId: string) => `${API_BASE_URL}/communities/${communityId}/join-requests/${requestId}/reject`,
    COMMUNITY_REMOVE_MEMBER: (communityId: string, userId: string) => `${API_BASE_URL}/communities/${communityId}/members/${userId}`,
    COMMUNITY_MEMBER_ROLE: (communityId: string, userId: string) => `${API_BASE_URL}/communities/${communityId}/members/${userId}/role`,

    // Groups (Within Communities)
    COMMUNITY_GROUPS: (communityId: string) => `${API_BASE_URL}/communities/${communityId}/groups`,
    COMMUNITY_GROUP_DETAIL: (communityId: string, groupId: string) => `${API_BASE_URL}/communities/${communityId}/groups/${groupId}`,

    // Standalone Groups
    GROUPS: `${API_BASE_URL}/groups`,
    GROUP_DETAIL: (groupId: string) => `${API_BASE_URL}/groups/${groupId}`,
    GROUP_MEMBERS: (groupId: string) => `${API_BASE_URL}/groups/${groupId}/members`,
    GROUP_MEMBER_DETAIL: (groupId: string, memberId: string) => `${API_BASE_URL}/groups/${groupId}/members/${memberId}`,
    GROUP_LEAVE: (groupId: string) => `${API_BASE_URL}/groups/${groupId}/leave`,
    GROUP_INVITE_LINK: (groupId: string) => `${API_BASE_URL}/groups/${groupId}/invite-link`,
    GROUP_JOIN_LINK: `${API_BASE_URL}/groups/join-via-link`,
    GROUP_ADMIN_ONLY_MESSAGING: (groupId: string) => `${API_BASE_URL}/groups/${groupId}/settings/admin-only-messaging`,

    // Messaging
    GROUP_MESSAGES: (groupId: string) => `${API_BASE_URL}/groups/${groupId}/messages`,
    GROUP_CHATS: `${API_BASE_URL}/group-chats`,
    MESSAGE_DETAIL: (messageId: string) => `${API_BASE_URL}/messages/${messageId}`,
    REACT_MESSAGE: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/react`,

    // Notifications
    NOTIFICATIONS: `${API_BASE_URL}/notifications`,
    NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    NOTIFICATION_READ_ALL: `${API_BASE_URL}/notifications/read-all`,
    NOTIFICATION_DETAIL: (id: string) => `${API_BASE_URL}/notifications/${id}`,
};
