export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isOfficialAccount?: boolean;
}