import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { normalizeEmail, sanitizeString, isValidObjectId } from "@/lib/validation";

type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

type AuthToken = {
  role?: string;
  id?: string;
} & Record<string, unknown>;

const authProviders = [
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    : null,
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? GithubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    : null,
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Invalid credentials");
      }

      const email = normalizeEmail(credentials.email);
      const password = sanitizeString(credentials.password);

      await dbConnect();
      const user = await User.findOne({ email });

      if (!user || !user.password) {
        throw new Error("Invalid credentials");
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new Error("Invalid credentials");
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };
    },
  }),
].filter(Boolean) as NonNullable<NextAuthOptions["providers"]>;

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be defined for authentication.");
}

export const authOptions: NextAuthOptions = {
  providers: authProviders,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.type === "oauth" && user?.email) {
        await dbConnect();
        const email = normalizeEmail(user.email);
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
          const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
          const role = adminEmails.includes(email) ? "admin" : "user";

          await User.create({
            name: sanitizeString(user.name) || email,
            email,
            image: user.image,
            role,
          });
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      const typedToken = token as AuthToken;
      if (user) {
        const typedUser = user as AuthUser;
        typedToken.role = typedUser.role ?? typedToken.role ?? "user";
        typedToken.id = typedUser.id ?? typedToken.id;
      }

      // Ensure OAuth users receive the MongoDB user id in the token when possible
      if (!isValidObjectId(typedToken.id) && (token as any).email) {
        try {
          await dbConnect();
          const existing = await User.findOne({ email: (token as any).email });
          if (existing) typedToken.id = existing._id.toString();
        } catch (e) {
          // don't fail auth flow for lookup errors; token.id may remain unset
        }
      }
      return typedToken;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as AuthUser;
        sessionUser.role = (token as AuthToken).role ?? "user";
        sessionUser.id = (token as AuthToken).id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
