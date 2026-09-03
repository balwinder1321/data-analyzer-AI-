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

// Always provide credentials-based auth for demo mode
providers.push(
  Credentials({
    name: 'Demo Login',
    credentials: {
      email: { label: 'Email', type: 'email' },
      name: { label: 'Name', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;
      return {
        id: 'demo-user-' + String(credentials.email).replace(/[^a-z0-9]/gi, ''),
        email: String(credentials.email),
        name: String(credentials.name || 'Demo User'),
        image: null,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  trustHost: true,
});
