export interface InstagramAccount {
  id: number;
  instagramUserId: string;
  username: string;
  name: string;
  profilePictureUrl?: string;
  isActive: boolean;
  connectedAt: Date;
}
