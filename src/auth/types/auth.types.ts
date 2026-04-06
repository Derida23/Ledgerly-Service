import { type AuthSession } from '../../lib/auth';

export type SessionUser = AuthSession['user'] & { role: string };
export type SessionData = AuthSession['session'];

export interface AuthenticatedRequest {
  user: SessionUser;
  session: SessionData;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}
