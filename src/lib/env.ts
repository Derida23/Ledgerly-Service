export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Returns allowed origins for CORS and Better Auth trustedOrigins.
 * Reads from CORS_ORIGINS env var (comma-separated).
 *
 * Example: CORS_ORIGINS=https://ledgerly.vercel.app,http://localhost:5173
 */
export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? '';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
