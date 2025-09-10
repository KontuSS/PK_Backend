export type Interest = {
  id: number;
  name: string;
  description?: string | null;
};

export type UserProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  nick: string;
  bio?: string | null;
  age?: number | null;
  createdAt: string;
  interests: Interest[];
};

export type UserProfileUpdate = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  age?: number;
  interests?: number[]; // Array of interest IDs
};
