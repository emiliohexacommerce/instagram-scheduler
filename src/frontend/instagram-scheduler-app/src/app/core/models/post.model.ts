export enum PostStatus { Draft = 'Draft', Scheduled = 'Scheduled', Published = 'Published', Failed = 'Failed' }
export enum PostType { Image = 'Image', Carousel = 'Carousel', Reel = 'Reel' }

export interface Post {
  id: number;
  accountId: number;
  accountUsername: string;
  caption: string;
  hashtags?: string;
  mediaUrls: string[];
  type: PostType;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
}

export interface CreatePostRequest {
  accountId: number;
  caption: string;
  hashtags?: string;
  mediaUrls: string[];
  type: PostType;
  scheduledAt?: Date;
}

export interface GenerateCaptionRequest {
  topic: string;
  tone: string;
  brandName?: string;
  extraContext?: string;
  includeHashtags: boolean;
}
