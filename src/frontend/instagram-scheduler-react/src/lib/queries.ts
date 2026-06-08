import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  name: string;
  email: string;
}

export type SocialPlatform = 'Instagram' | 'Facebook' | 'Threads' | 'LinkedIn';
export type PostStatus = 'Draft' | 'Scheduled' | 'Processing' | 'Published' | 'Failed';
export type PostType = 'Image' | 'Carousel' | 'Reel';

export interface SocialAccount {
  id: number;
  platform: SocialPlatform;
  platformUserId: string;
  username: string;
  name: string;
  profilePictureUrl?: string;
  tokenExpiresAt: string;
  isActive: boolean;
  connectedAt: string;
}

export interface PostResult {
  platform: SocialPlatform;
  status: PostStatus;
  platformPostId?: string;
  errorMessage?: string;
  publishedAt?: string;
}

export interface ScheduledPost {
  id: number;
  userId: number;
  caption: string;
  hashtags?: string;
  mediaUrls: string[];
  type: PostType;
  status: PostStatus;
  platforms: SocialPlatform[];
  results: PostResult[];
  scheduledAt?: string;
  createdAt: string;
}

export interface CreatePostRequest {
  caption: string;
  hashtags?: string;
  mediaUrls: string[];
  type: PostType;
  platforms: SocialPlatform[];
  scheduledAt?: string;
}

export interface UpdatePostRequest {
  caption?: string;
  hashtags?: string;
  mediaUrls?: string[];
  platforms?: SocialPlatform[];
  scheduledAt?: string;
  status?: PostStatus;
}

export interface UploadResponse {
  blobName: string;
  url: string;
  contentType: string;
  sizeBytes: number;
}

export type SubscriptionStatus = 'Trial' | 'Active' | 'PendingPayment' | 'Suspended' | 'Cancelled';

export interface Plan {
  id: number;
  name: string;
  description: string;
  priceMonthly: number;
  maxAccounts: number;
  maxPostsPerMonth: number;
  maxPostsPerWeek: number;
  isUnlimited: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: number;
  planId: number;
  planName: string;
  status: SubscriptionStatus;
  isTrial: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  priceMonthly: number;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export const useLogin = () =>
  useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', data),
  });

export const useRegister = () =>
  useMutation({
    mutationFn: (data: { name: string; email: string; password: string; planId?: number }) =>
      api.post<AuthResponse>('/auth/register', data),
  });

// ── Accounts ──────────────────────────────────────────────────────────────────

export const useAccounts = (platform?: SocialPlatform) =>
  useQuery({
    queryKey: ['accounts', platform],
    queryFn: () => api.get<SocialAccount[]>(platform ? `/accounts?platform=${platform}` : '/accounts'),
  });

export const useConnectAccount = () =>
  useMutation({
    mutationFn: (platform: SocialPlatform) =>
      api.get<{ url: string }>(`/accounts/connect/${platform}`),
  });

export interface FacebookPageOption {
  pageId: string;
  name: string;
  pictureUrl?: string;
  pageToken: string;
}

export const useGetFacebookPages = () =>
  useMutation({
    mutationFn: (accessToken: string) =>
      api.post<FacebookPageOption[]>('/accounts/facebook-pages', { accessToken }),
  });

export const useConnectFacebookPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (page: FacebookPageOption) =>
      api.post<SocialAccount>('/accounts/connect-facebook-page', {
        pageId: page.pageId,
        pageName: page.name,
        pictureUrl: page.pictureUrl,
        pageToken: page.pageToken,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
};

export const useConnectWithToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accessToken, platform }: { accessToken: string; platform: SocialPlatform }) =>
      api.post<SocialAccount>('/accounts/connect-token', { accessToken, platform }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
};

export const useDisconnectAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
};

// ── Posts ─────────────────────────────────────────────────────────────────────

export const usePosts = () =>
  useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get<ScheduledPost[]>('/posts'),
  });

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostRequest) => api.post<ScheduledPost>('/posts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
};

export const useUpdatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePostRequest }) =>
      api.put<ScheduledPost>(`/posts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
};

export const usePublishNow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<ScheduledPost>(`/posts/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
};

// ── Media ─────────────────────────────────────────────────────────────────────

export const useUploadMedia = () =>
  useMutation({
    mutationFn: (file: File) => api.upload<UploadResponse>('/media/upload', file),
  });

// ── Plans & Subscriptions ────────────────────────────────────────────────────

export const usePlans = () =>
  useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/plans'),
  });

export const useSubscription = () =>
  useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get<Subscription>('/subscriptions/me'),
    retry: false,
  });

export const useCheckout = () =>
  useMutation({
    mutationFn: (planId: number) =>
      api.post<{ paymentUrl: string; token: string; orderId: string }>('/subscriptions/checkout', { planId }),
  });

// ── Profile ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  email: string;
  timeZone: string;
}

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<UserProfile>('/profile'),
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; timeZone?: string }) =>
      api.put<UserProfile>('/profile', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

// ── LinkedIn ──────────────────────────────────────────────────────────────────

export interface LinkedInAccountOption {
  id: string;
  name: string;
  pictureUrl?: string;
  type: 'personal' | 'organization';
}

export const useGetLinkedInOrgs = () =>
  useMutation({
    mutationFn: (accountId: number) =>
      api.get<LinkedInAccountOption[]>(`/accounts/linkedin-orgs/${accountId}`),
  });

export const useConnectLinkedInOrg = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { personalAccountId: number; orgId: string; orgName: string; pictureUrl?: string }) =>
      api.post<SocialAccount>('/accounts/connect-linkedin-org', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface PlatformStat {
  platform: string;
  total: number;
  published: number;
  failed: number;
}

export interface TimelinePoint {
  date: string;
  published: number;
  failed: number;
}

export interface AnalyticsOverview {
  totalPosts: number;
  publishedPosts: number;
  failedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  successRate: number;
  thisWeekPosts: number;
  thisMonthPosts: number;
  platformBreakdown: PlatformStat[];
  timeline: TimelinePoint[];
}

export interface AccountInsights {
  accountId: number;
  platform: string;
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
  mediaCount?: number;
}

export const useAnalytics = (days = 30) =>
  useQuery({
    queryKey: ['analytics', days],
    queryFn: () => api.get<AnalyticsOverview>(`/analytics?days=${days}`),
  });

export const useAccountInsights = (accountId: number | null) =>
  useQuery({
    queryKey: ['insights', accountId],
    queryFn: () => api.get<AccountInsights>(`/analytics/insights/${accountId}`),
    enabled: accountId !== null,
  });

// ── Inbox ─────────────────────────────────────────────────────────────────────

export interface InboxReply {
  id: string;
  authorUsername: string;
  text: string;
  timestamp: string;
}

export interface InboxComment {
  id: string;
  authorUsername: string;
  text: string;
  timestamp: string;
  replies: InboxReply[];
}

export interface InboxPost {
  postId: string;
  platform: SocialPlatform;
  accountId: number;
  accountUsername: string;
  accountPictureUrl?: string;
  caption: string;
  mediaUrl?: string;
  postedAt: string;
  commentsCount: number;
  comments: InboxComment[];
}

export const useInbox = (accountId?: number) =>
  useQuery({
    queryKey: ['inbox', accountId],
    queryFn: () => api.get<InboxPost[]>(accountId ? `/inbox?accountId=${accountId}` : '/inbox'),
    staleTime: 60_000,
  });

export const useReplyToComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; platform: string; accountId: number; message: string }) =>
      api.post('/inbox/reply', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
};

// ── AI Caption ────────────────────────────────────────────────────────────────

export interface GenerateCaptionRequest {
  topic: string;
  tone: string;
  brandName?: string;
  extraContext?: string;
  includeHashtags: boolean;
}

export const useGenerateCaption = () =>
  useMutation({
    mutationFn: (data: GenerateCaptionRequest) =>
      api.post<{ caption: string }>('/ai/generate-caption', data),
  });
