import { create } from "zustand";

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  relativeTime: string;
  absoluteTime: string;
  content: string;
  imageLabel?: string;
  likes: number;
  liked: boolean;
  comments: number;
  groupId?: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  relativeTime: string;
  absoluteTime: string;
  likes: number;
  liked: boolean;
};

export type CommunityGroup = {
  id: string;
  name: string;
  privacy: "Public" | "Private";
  description: string;
  location: string;
  members: number;
  posts: number;
  tags: string[];
  joined: boolean;
  novaInsight: string;
};

export type CommunityProfile = {
  id: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  followers: number;
  contributions: number;
  topSkills: string[];
};

type CreatePostInput = {
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  imageLabel?: string;
  groupId?: string;
};

type CommunityState = {
  posts: CommunityPost[];
  comments: Record<string, CommunityComment[]>;
  groups: CommunityGroup[];
  profiles: Record<string, CommunityProfile>;
  appendPosts: (posts: CommunityPost[]) => void;
  togglePostLike: (postId: string) => CommunityPost | undefined;
  createPost: (input: CreatePostInput) => CommunityPost;
  addComment: (postId: string, input: Omit<CreatePostInput, "content" | "imageLabel" | "groupId"> & { body: string }) => CommunityComment;
  toggleCommentLike: (postId: string, commentId: string) => CommunityComment | undefined;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
};

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    authorId: "user-amina",
    authorName: "Amina Njeri",
    authorRole: "Diaspora Operator",
    relativeTime: "3 hours ago",
    absoluteTime: "Posted at 2:30 PM",
    content:
      "We just mapped a new operator path that turns community replies into Academy follow-ups and Market offers without breaking the user journey.",
    imageLabel: "A planning board showing content, course, and offer handoffs.",
    likes: 41,
    liked: false,
    comments: 12,
    groupId: "group-winners-africa",
  },
  {
    id: "post-2",
    authorId: "user-samuel",
    authorName: "Samuel Osei",
    authorRole: "Growth Strategist",
    relativeTime: "5 hours ago",
    absoluteTime: "Posted at 12:10 PM",
    content:
      "Creator collaboration thread is open. Looking for editors, hosts, and community leads who want to build a cross-border campaign this week.",
    likes: 27,
    liked: true,
    comments: 8,
    groupId: "group-diaspora-tech",
  },
  {
    id: "post-3",
    authorId: "user-lebo",
    authorName: "Lebo Dlamini",
    authorRole: "Community Lead",
    relativeTime: "Just now",
    absoluteTime: "Posted at 5:42 PM",
    content: "New members are asking for a founders-only Q&A. NOVA thinks the signal is strong enough to schedule it this week.",
    likes: 6,
    liked: false,
    comments: 2,
  },
  {
    id: "post-4",
    authorId: "user-kwame",
    authorName: "Kwame Boateng",
    authorRole: "Partnership Builder",
    relativeTime: "2 minutes ago",
    absoluteTime: "Posted at 5:40 PM",
    content: "Just closed another diaspora partnership intro. Sharing the partner brief template if anyone wants to reuse it.",
    likes: 9,
    liked: false,
    comments: 1,
    groupId: "group-builders-circle",
  },
  {
    id: "post-5",
    authorId: "user-zuri",
    authorName: "Zuri Kamau",
    authorRole: "Content Systems",
    relativeTime: "4 minutes ago",
    absoluteTime: "Posted at 5:38 PM",
    content: "NOVA generated alt text for this launch storyboard and it was surprisingly accurate. We should ship that into the posting flow next.",
    likes: 14,
    liked: false,
    comments: 4,
  },
];

const INITIAL_COMMENTS: Record<string, CommunityComment[]> = {
  "post-1": [
    {
      id: "comment-1",
      postId: "post-1",
      authorId: "user-lebo",
      authorName: "Lebo Dlamini",
      authorRole: "Community Lead",
      body: "This should be promoted into the Academy launch checklist by tomorrow morning.",
      relativeTime: "1 hour ago",
      absoluteTime: "Commented at 4:10 PM",
      likes: 6,
      liked: false,
    },
    {
      id: "comment-2",
      postId: "post-1",
      authorId: "user-zuri",
      authorName: "Zuri Kamau",
      authorRole: "Content Systems",
      body: "We can package this into a creator webinar and a follow-up template.",
      relativeTime: "42 minutes ago",
      absoluteTime: "Commented at 4:28 PM",
      likes: 3,
      liked: true,
    },
  ],
  "post-2": [
    {
      id: "comment-3",
      postId: "post-2",
      authorId: "user-amina",
      authorName: "Amina Njeri",
      authorRole: "Diaspora Operator",
      body: "I can support with the operator brief and host outline.",
      relativeTime: "28 minutes ago",
      absoluteTime: "Commented at 4:42 PM",
      likes: 4,
      liked: false,
    },
  ],
};

const INITIAL_GROUPS: CommunityGroup[] = [
  {
    id: "group-winners-africa",
    name: "Winners Africa",
    privacy: "Public",
    description: "Operators, founders, and creators building high-trust businesses across the continent.",
    location: "Pan-African",
    members: 428,
    posts: 118,
    tags: ["Operators", "Founders", "Growth"],
    joined: true,
    novaInsight: "Momentum is strongest around founder Q&A and diaspora partner intros this week.",
  },
  {
    id: "group-diaspora-tech",
    name: "Diaspora Tech",
    privacy: "Public",
    description: "Cross-border builders sharing stack decisions, hiring patterns, and distribution lessons.",
    location: "Global Diaspora",
    members: 312,
    posts: 84,
    tags: ["Tech", "Hiring", "Remote"],
    joined: true,
    novaInsight: "Remote React Native and backend collaboration threads are getting the fastest responses.",
  },
  {
    id: "group-builders-circle",
    name: "Builders Circle",
    privacy: "Private",
    description: "Invite-only space for launch operators, monetization strategists, and execution partners.",
    location: "Members Only",
    members: 146,
    posts: 39,
    tags: ["Monetization", "Launches", "Strategy"],
    joined: false,
    novaInsight: "Applications spike when members post clear weekly asks instead of broad introductions.",
  },
  {
    id: "group-east-africa-creators",
    name: "East Africa Creators",
    privacy: "Public",
    description: "Creators, editors, and hosts refining monetization and audience trust across East Africa.",
    location: "East Africa",
    members: 267,
    posts: 71,
    tags: ["Creators", "Media", "Audience"],
    joined: false,
    novaInsight: "Short-form storytelling templates are outperforming static launch posts this month.",
  },
];

const INITIAL_PROFILES: Record<string, CommunityProfile> = {
  "user-amina": {
    id: "user-amina",
    name: "Amina Njeri",
    role: "Diaspora Operator",
    location: "Nairobi, Kenya",
    bio: "Building cross-border systems that move users from trust to transaction without friction.",
    followers: 892,
    contributions: 127,
    topSkills: ["Community Ops", "Launch Strategy", "Funnels"],
  },
  "user-samuel": {
    id: "user-samuel",
    name: "Samuel Osei",
    role: "Growth Strategist",
    location: "Accra, Ghana",
    bio: "Focused on high-signal partnerships, creator monetization, and repeatable activation loops.",
    followers: 644,
    contributions: 83,
    topSkills: ["Growth", "Partnerships", "Analytics"],
  },
  "user-lebo": {
    id: "user-lebo",
    name: "Lebo Dlamini",
    role: "Community Lead",
    location: "Johannesburg, South Africa",
    bio: "Designing high-trust community rituals, launch cadences, and operator accountability systems.",
    followers: 521,
    contributions: 96,
    topSkills: ["Community Design", "Moderation", "Events"],
  },
  "user-kwame": {
    id: "user-kwame",
    name: "Kwame Boateng",
    role: "Partnership Builder",
    location: "Accra, Ghana",
    bio: "Connecting founders, creators, and distribution partners across the diaspora growth network.",
    followers: 403,
    contributions: 61,
    topSkills: ["Partnerships", "BD", "Introductions"],
  },
  "user-zuri": {
    id: "user-zuri",
    name: "Zuri Kamau",
    role: "Content Systems",
    location: "Nairobi, Kenya",
    bio: "Turning raw ideas into repeatable content systems that compound trust and conversion.",
    followers: 477,
    contributions: 72,
    topSkills: ["Content Ops", "Editorial", "Storytelling"],
  },
};

function stampRelativeTime() {
  return "Just now";
}

function stampAbsoluteTime(prefix: "Posted" | "Commented") {
  return `${prefix} just now`;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: INITIAL_POSTS,
  comments: INITIAL_COMMENTS,
  groups: INITIAL_GROUPS,
  profiles: INITIAL_PROFILES,

  appendPosts: (posts) => {
    set((state) => {
      const seen = new Set(state.posts.map((post) => post.id));
      const nextPosts = posts.filter((post) => !seen.has(post.id));

      return {
        posts: [...state.posts, ...nextPosts],
      };
    });
  },

  togglePostLike: (postId) => {
    let updatedPost: CommunityPost | undefined;

    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const liked = !post.liked;
        updatedPost = {
          ...post,
          liked,
          likes: Math.max(0, post.likes + (liked ? 1 : -1)),
        };

        return updatedPost;
      }),
    }));

    return updatedPost;
  },

  createPost: (input) => {
    const post: CommunityPost = {
      id: `post-created-${Date.now()}`,
      authorId: input.authorId,
      authorName: input.authorName,
      authorRole: input.authorRole,
      relativeTime: stampRelativeTime(),
      absoluteTime: stampAbsoluteTime("Posted"),
      content: input.content.trim(),
      imageLabel: input.imageLabel?.trim() || undefined,
      likes: 0,
      liked: false,
      comments: 0,
      groupId: input.groupId,
    };

    set((state) => ({
      posts: [post, ...state.posts],
      groups: state.groups.map((group) =>
        group.id === input.groupId
          ? {
              ...group,
              posts: group.posts + 1,
            }
          : group,
      ),
    }));

    return post;
  },

  addComment: (postId, input) => {
    const comment: CommunityComment = {
      id: `comment-created-${Date.now()}`,
      postId,
      authorId: input.authorId,
      authorName: input.authorName,
      authorRole: input.authorRole,
      body: input.body.trim(),
      relativeTime: stampRelativeTime(),
      absoluteTime: stampAbsoluteTime("Commented"),
      likes: 0,
      liked: false,
    };

    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: [comment, ...(state.comments[postId] ?? [])],
      },
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments + 1,
            }
          : post,
      ),
    }));

    return comment;
  },

  toggleCommentLike: (postId, commentId) => {
    let updatedComment: CommunityComment | undefined;

    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: (state.comments[postId] ?? []).map((comment) => {
          if (comment.id !== commentId) {
            return comment;
          }

          const liked = !comment.liked;
          updatedComment = {
            ...comment,
            liked,
            likes: Math.max(0, comment.likes + (liked ? 1 : -1)),
          };

          return updatedComment;
        }),
      },
    }));

    return updatedComment;
  },

  joinGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              joined: true,
              members: group.members + 1,
            }
          : group,
      ),
    }));
  },

  leaveGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              joined: false,
              members: Math.max(0, group.members - 1),
            }
          : group,
      ),
    }));
  },
}));

export function getCommunityPost(postId: string) {
  return useCommunityStore.getState().posts.find((post) => post.id === postId);
}

export function getCommunityGroup(groupId: string) {
  return useCommunityStore.getState().groups.find((group) => group.id === groupId);
}

export function getCommunityComments(postId: string) {
  return useCommunityStore.getState().comments[postId] ?? [];
}

export function getCommunityPostsForGroup(groupId: string) {
  return useCommunityStore.getState().posts.filter((post) => post.groupId === groupId);
}

export function getCommunityProfile(userId: string) {
  return useCommunityStore.getState().profiles[userId];
}

export function getCommunityPostsForUser(userId: string) {
  return useCommunityStore.getState().posts.filter((post) => post.authorId === userId);
}
