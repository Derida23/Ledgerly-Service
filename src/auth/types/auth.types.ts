export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}

export interface AuthenticatedRequest {
  user: SessionUser;
  session: SessionData;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}
