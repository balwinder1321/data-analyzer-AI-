import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

const isDemoMode = !process.env.GOOGLE_CLIENT_ID || process.env.DEMO_MODE === 'true';

const providers = [];

if (!isDemoMode && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  );
}

import { db, COLLECTIONS, DBUser, initDefaultUsers } from './db';

// Always provide credentials-based auth with approval verification
providers.push(
  Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email and password are required');
      }

      const email = String(credentials.email).trim().toLowerCase();
      const password = String(credentials.password).trim();

      // Ensure default accounts exist
      initDefaultUsers();

      const user = db.findOne<DBUser>(COLLECTIONS.USERS, u => u.email.toLowerCase() === email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (user.password !== password) {
        throw new Error('Invalid email or password');
      }

      if (user.status === 'PENDING') {
        throw new Error('Your account is awaiting approval by administrator (admin@bob.com).');
      }

      if (user.status === 'REJECTED') {
        throw new Error('Your account access has been revoked or rejected.');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      };
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.provider = account.provider;
      }
      if (user) {
        token.userId = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as any).role || 'USER';
        token.status = (user as any).status || 'APPROVED';
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.role) {
        (session.user as any).role = token.role as string;
      }
      if (token.status) {
        (session.user as any).status = token.status as string;
      }
      return session;
    },
  },
  trustHost: true,
});
