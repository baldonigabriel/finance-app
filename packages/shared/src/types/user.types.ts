export interface User {
  id: string;
  email: string;
  name: string | null;
  whatsappNumber: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: Pick<User, 'id' | 'email' | 'name'>;
}
