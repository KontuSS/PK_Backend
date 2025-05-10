export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nick: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    nick: string;
  };
}