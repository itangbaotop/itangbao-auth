// src/lib/auth/config.ts
import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from "../db"
import { applications, users } from "../db/schema"
import { eq, and } from "drizzle-orm"
import { D1Adapter } from "@auth/d1-adapter"
import { nanoid } from "nanoid"
import { hashPassword } from "../utils/password";
import { signJwt } from "../utils/jwt"
import { OAuth2Client } from 'google-auth-library';

export const runtime = 'edge'; 

const AUTH_CONFIG = {
  enableMagicLink: process.env.ENABLE_MAGIC_LINK !== "false", // 魔法链接登录
  enableGoogleLogin: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  enableGithubLogin: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
}


// 注意这里的改动
export const authConfig: NextAuthConfig = {
  providers: [
    ...([
      CredentialsProvider({
        id: "admin-credentials",
        name: "Admin Login",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials, request) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const { env } = await getCloudflareContext()
          const db = getDb(env.DB)

          // 查找管理员用户
          const user = await db.select()
            .from(users)
            .where(and(
              eq(users.email, credentials.email as string),
              eq(users.role, "admin")
            ))
            .limit(1)

          if (!user[0] || !user[0].password) {
            return null
          }

          // 验证密码
          const hashedPassword = await hashPassword(credentials.password as string)
          if (hashedPassword !== user[0].password) {
            return null
          }

          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].image,
            role: user[0].role,
          }
        }
      })
    ]),

    ...(AUTH_CONFIG.enableGoogleLogin ? [
      CredentialsProvider({
        id: "google-one-tap-credentials", // 独特的 ID
        name: "Google One Tap",
        credentials: {
          id_token: { label: "ID Token", type: "text" } // 接收 ID Token
        },
        async authorize(credentials) {
          console.log("--- Custom Google One Tap Credentials Provider called ---");
          console.log("Credentials received:", credentials);

          if (!credentials?.id_token) {
            console.error("Missing ID Token in credentials.");
            return null;
          }

          try {
            const googleClientId = process.env.GOOGLE_CLIENT_ID;
            if (!googleClientId) {
              console.error("GOOGLE_CLIENT_ID 未定义，无法验证 Google ID Token。");
              return null;
            }

            const googleOAuth2Client = new OAuth2Client(googleClientId);

            // 验证 Google ID Token
            const ticket = await googleOAuth2Client.verifyIdToken({
                idToken: credentials.id_token as string,
                audience: process.env.GOOGLE_CLIENT_ID, // 必须是你的 Client ID
            });
            const payload = ticket.getPayload(); // 获取 ID Token 的载荷

            if (!payload || !payload.email) {
              console.error("Failed to get payload or email from ID Token.");
              return null;
            }

            console.log("Google ID Token Payload:", payload);

            const { env } = await getCloudflareContext();
            const db = getDb(env.DB);

            // 检查用户是否存在，不存在则创建
            let userRecord = await db.select()
              .from(users)
              .where(eq(users.email, payload.email))
              .limit(1);

            if (!userRecord[0]) {
              console.log("Creating new user for Google One Tap:", payload.email);
              const newUserId = nanoid();
              const newUser = await db.insert(users).values({
                id: newUserId,
                name: payload.name || payload.email.split('@')[0],
                email: payload.email,
                image: payload.picture,
                role: "user",
                emailVerified: new Date(payload.email_verified ? payload.exp * 1000 : 0), // 根据 ID Token 信息设置
              }).returning();
              userRecord = newUser;
            } else {
              console.log("Existing user found for Google One Tap:", payload.email);
              // 如果需要，可以更新用户信息，例如头像
              await db.update(users)
                .set({
                  name: payload.name || userRecord[0].name,
                  image: payload.picture || userRecord[0].image,
                  emailVerified: new Date(payload.email_verified ? payload.exp * 1000 : 0),
                  updatedAt: new Date(),
                })
                .where(eq(users.id, userRecord[0].id));
            }

            return {
              id: userRecord[0].id,
              email: userRecord[0].email,
              name: userRecord[0].name,
              image: userRecord[0].image,
              role: userRecord[0].role,
            };

          } catch (error) {
            console.error("Google ID Token 验证失败:", error);
            return null;
          }
        }
      })
    ] : []),

    // Google 登录
    ...(AUTH_CONFIG.enableGoogleLogin ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      })
    ] : []),

    // GitHub 登录
    ...(AUTH_CONFIG.enableGithubLogin ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      })
    ] : []),
  ],
  pages: {
    signIn: "/auth/signin",
    error: '/auth/error',
    verifyRequest: "/auth/verify-request", // 魔法链接发送后的页面
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log("--- NextAuth signIn callback called ---");
      console.log("User object in callback:", user);
      console.log("Account object in callback:", account);
      console.log("Profile object in callback:", profile);

      if (account?.provider === "admin-credentials" || account?.provider === "google-one-tap-credentials") {
        return true;
      }

      // 处理所有登录方式的自动用户创建
      const { env } = await getCloudflareContext()
      const db = getDb(env.DB)

      // 检查用户是否已存在
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, user.email!))
        .limit(1)

      if (!existingUser[0]) {
        if (account?.provider === "github") {
          // 设置新用户的默认角色
          user.role = "user";
        } else if (account?.provider === "google") {
          console.log("Google One Tap (OIDC) login detected.");
          console.log("Account ID Token:", account.id_token);
          // 设置新用户的默认角色
          user.role = "user";
        } else if (account?.provider === "email" && AUTH_CONFIG.enableMagicLink) {
          // 自动创建新用户
          try {
            const newUser = await db.insert(users).values({
              id: user.id || nanoid(),
              name: user.name || user.email?.split('@')[0] || "新用户",
              email: user.email!,
              image: user.image,
              role: "user",
              emailVerified: account?.provider === "email" ? new Date() : null,
            }).returning()

            user.role = "user"
          } catch (error) {
            console.error("自动注册失败:", error)
            return false
          }
        }
      } else {
        // 用户已存在，使用数据库中的角色
        user.role = existingUser[0].role
        
        // 如果是邮箱验证登录，更新验证状态
        if (account?.provider === "email" && !existingUser[0].emailVerified) {
          await db.update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, existingUser[0].id))
        }
      }
      return true
    },
    
  },
  session: {
    strategy: "jwt"
  },
  // 边缘环境优化
  trustHost: true
}

// 导出 auth 函数
export const { handlers, auth, signIn, signOut } = NextAuth((request) => {
    const context = getCloudflareContext();
    const _db = getDb(context.env.DB);
    // 动态设置 adapter
    return {
        ...authConfig,
        adapter: D1Adapter(context.env.DB),
    }
});

export { AUTH_CONFIG };
