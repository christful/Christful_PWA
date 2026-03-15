# Frontend Integration Docs: New Endpoints

Base URL:
- Production: `https://christful-backend.vercel.app`
- Local: `http://localhost:5000`

Authentication:
- All endpoints below require JWT auth.
- Header: `Authorization: Bearer <token>`

Common Response Conventions:
- Timestamps are ISO 8601 strings in UTC (e.g. `2026-03-08T00:00:00.000Z`).
- Paginated responses include `page`, `total`, and `totalPages`.
- Most list feeds are ordered newest-first unless stated otherwise.

---

## 1) User Profile Details

Endpoint:
- `GET /users/:id/profile-details`

Purpose:
- Fetch full profile data for any user, including their posts, reels, saved posts, stats, and relationship to current user.

Path params:
- `id` (UUID): target user id

Success response: `200 OK`
```json
{
  "message": "User profile details fetched successfully",
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "bio": "Bio",
    "avatarUrl": "https://...",
    "createdAt": "2026-03-08T00:00:00.000Z",
    "updatedAt": "2026-03-08T00:00:00.000Z"
  },
  "posts": [],
  "reels": [],
  "savedPosts": [],
  "stats": {
    "followers": 10,
    "following": 7,
    "posts": 15,
    "reels": 3,
    "savedPosts": 21
  },
  "relationship": {
    "isSelf": false,
    "isFollowing": true
  }
}
```

Error responses:
- `404`: user not found
- `500`: server error

Notes:
- `posts` contains non-reel posts.
- `reels` contains only `video` and `text_video`.
- `savedPosts` returns full post objects saved by the target user.
- `relationship.isSelf` lets the UI decide whether to show edit profile actions.

---

## 2) Group Details

Endpoint:
- `GET /groups/:id/details`

Purpose:
- Fetch comprehensive group details (group info, members, chat info, latest messages, requester membership, and stats).

Path params:
- `id` (UUID): group id

Access rule:
- Requester must be a member of that group.

Success response: `200 OK`
```json
{
  "message": "Group details fetched successfully",
  "group": {
    "id": "uuid",
    "name": "Design Team",
    "description": "Group description",
    "avatarUrl": "https://...",
    "communityId": "uuid",
    "createdBy": "uuid",
    "adminOnlyMessaging": false,
    "creator": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "avatarUrl": "https://..."
    },
    "community": {
      "id": "uuid",
      "name": "Community Name"
    },
    "members": []
  },
  "groupChat": {
    "id": "uuid",
    "groupId": "uuid",
    "createdBy": "uuid",
    "messages": []
  },
  "membership": {
    "id": "uuid",
    "role": "admin",
    "joinedAt": "2026-03-08T00:00:00.000Z"
  },
  "stats": {
    "members": 12,
    "admins": 2,
    "messages": 340
  }
}
```

Error responses:
- `403`: not a group member
- `404`: group not found
- `500`: server error

Notes:
- `groupChat.messages` returns latest 30 messages, ordered newest first.
- Each message includes `sender` details.
- Use `membership.role` to drive admin-only UI actions.

---

## 3) Get All Reels

Endpoint:
- `GET /reels`

Purpose:
- Fetch paginated reels feed with author, likes, and comments.

Query params:
- `page` (number, optional, default `1`)
- `limit` (number, optional, default `10`)

Success response: `200 OK`
```json
{
  "reels": [
    {
      "id": "uuid",
      "content": "My reel",
      "videoUrl": "https://...",
      "mediaType": "video",
      "createdAt": "2026-03-08T00:00:00.000Z",
      "author": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "avatarUrl": "https://..."
      },
      "likes": [
        {
          "id": "uuid",
          "userId": "uuid",
          "user": {
            "id": "uuid",
            "firstName": "Liker",
            "lastName": "Name",
            "avatarUrl": "https://..."
          }
        }
      ],
      "comments": [
        {
          "id": "uuid",
          "content": "Nice one",
          "createdAt": "2026-03-08T00:00:00.000Z",
          "author": {
            "id": "uuid",
            "firstName": "Commenter",
            "lastName": "Name",
            "avatarUrl": "https://..."
          }
        }
      ]
    }
  ],
  "total": 120,
  "page": 1,
  "totalPages": 12
}
```

Error responses:
- `500`: server error

Notes:
- Includes only posts where `mediaType` is `video` or `text_video`.
- Ordered by newest first.
- `likes` and `comments` are hydrated with user details for immediate rendering.

---

## Extra Integration Notes

- Auth failure handling:
  - `401`/`403`: clear token, redirect to login, and show a brief toast.
- Defensive null handling:
  - Some `avatarUrl` fields may be null; use fallbacks.
- UI recommendations:
  - Reels feed: prefetch next page when user scrolls past 60% of list height.
  - Group details: load `groupChat.messages` lazily if the chat panel isn’t opened.
