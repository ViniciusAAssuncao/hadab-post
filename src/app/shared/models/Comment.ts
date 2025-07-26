import { PostStats } from './Post';
import { User } from './User';

export interface Comments {
  id: string;
  postId: string;
  content: string;
  author?: User | null;
  createdAt: Date;
  stats?: PostStats;
  repliesId?: string | string[];
}

export interface NestedComment extends Comments {
  replies: NestedComment[];
}

export interface CommentsReply {
  id: string;
  content: string;
  author?: User | null;
  createdAt: Date;
  stats?: PostStats;
}
