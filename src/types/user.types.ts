export type UserProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  nick: string;
  bio?: string;
  age?: number;
  createdAt: Date;
};

export type UserProfileUpdate = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  age?: number;
};