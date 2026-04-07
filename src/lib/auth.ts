import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

let authInstance: Awaited<ReturnType<typeof createAuth>> | null = null;

async function createAuth() {
  const { betterAuth } = await import('better-auth');
  const { prismaAdapter } = await import('better-auth/adapters/prisma');

  const pool = new pg.Pool({ connectionString: requireEnv('DATABASE_URL') });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    secret: requireEnv('BETTER_AUTH_SECRET'),
    baseURL: requireEnv('BETTER_AUTH_URL'),
    trustedOrigins: [requireEnv('FRONTEND_URL')],

    socialProviders: {
      google: {
        clientId: requireEnv('GOOGLE_CLIENT_ID'),
        clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },

    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const adminEmail = process.env.ADMIN_EMAIL;
            const viewerEmail = process.env.VIEWER_EMAIL;
            const email = user.email;

            if (email !== adminEmail && email !== viewerEmail) {
              return false;
            }

            return {
              data: {
                ...user,
                role: email === adminEmail ? 'ADMIN' : 'VIEWER',
              },
            };
          },
        },
      },
    },
  });
}

export async function getAuth() {
  if (!authInstance) {
    authInstance = await createAuth();
  }
  return authInstance;
}

export type AuthInstance = Awaited<ReturnType<typeof createAuth>>;
