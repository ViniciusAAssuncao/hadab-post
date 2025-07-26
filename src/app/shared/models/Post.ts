import { User } from "./User";

export interface Post {
  id: string;
  title?: string;
  content: string;
  category?: PostCategory;
  author?: User;
  publishedAt: Date;
  stats?: PostStats;
  imageUrl?: string;
  tags?: string[];
  isPromoted?: boolean;
}

export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  backgroundColor: string;
}

export interface PostStats {
  id: string;
  views?: number;
  likes?: number;
  shares?: number;
  timeAgo?: string;
}

export interface PostInteraction {
  id: string;
  type: 'like' | 'comment' | 'share' | 'bookmark';
}