// src/lib/auth/config.ts
import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from "../db"
import { refreshTokens, users } from "../db/schema"
import { eq, and } from "drizzle-orm"
import { D1Adapter } from "@auth/d1-adapter"
import { nanoid } from "nanoid"
import { hashPassword } from "../utils/password";

export const runtime = 'edge';

// 读取 Cloudflare Env，计算哪些能力启用
function getAuthFlags(env: Record<string, unknown>) {
  return {
    enableMagicLink: (env.ENABLE_MAGIC_LINK as string | undefined) !== "false",
    enableGoogleLogin: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    enableGithubLogin: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  } as const;
}

// 基础配置（不在顶层访问 env），providers 将在工厂函数中动态生成
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
    error: '/auth/error',
    verifyRequest: "/auth/verify-request", // 魔法链接发送后的页面
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub!
        ;(session.user as any).role = token.role as string
      }
      return session
    },
    async signOut({ token }) {
      // 当用户通过 NextAuth 登出时，撤销相关的 OAuth refresh tokens
      if (token?.sub) {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        
        // 撤销该用户的所有未撤销的 refresh tokens
        await db.update(refreshTokens)
          .set({ isRevoked: true, updatedAt: new Date() })
          .where(and(
            eq(refreshTokens.userId, token.sub),
            eq(refreshTokens.isRevoked, false)
          ));
      }
    },
    async signIn({ user, account }) {
      console.log("Sign-in attempt:", { user, account });
      
      if (account?.provider === "admin-credentials" || account?.provider === "google-one-tap-credentials") {
        return true;
      }

      const { env } = await getCloudflareContext()
      const db = getDb((env as any).DB)
      const flags = getAuthFlags(env as unknown as Record<string, unknown>);

      // 检查用户是否已存在
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, (user as any).email!))
        .limit(1)

      if (!existingUser[0]) {
        if (account?.provider === "github") {
          ;(user as any).role = "user";
        } else if (account?.provider === "google") {
          ;(user as any).role = "user";
        } else if (account?.provider === "email" && flags.enableMagicLink) {
          try {
            await db.insert(users).values({
              id: (user as any).id || nanoid(),
              name: (user as any).name || (user as any).email?.split('@')[0] || "新用户",
              email: (user as any).email!,
              image: (user as any).image,
              role: "user",
              emailVerified: account?.provider === "email" ? new Date() : null,
            }).returning()

            ;(user as any).role = "user"
          } catch (error) {
            console.error("自动注册失败:", error)
            return false
          }
        }
      } else {
        ;(user as any).role = existingUser[0].role
        if (account?.provider === "email" && !existingUser[0].emailVerified) {
          await db.update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, existingUser[0].id))
        }
      }
      return true
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
}

// 导出 auth 函数（在这里动态读取 env 并组装 providers 与 adapter）
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const context = await getCloudflareContext();
  const env: any = context.env;
  const flags = getAuthFlags(env as unknown as Record<string, unknown>);
  const db = getDb(env.DB);

  const providers: NextAuthConfig["providers"] = [
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // 查找管理员用户
        const user = await db.select()
          .from(users)
          .where(and(
            eq(users.email, credentials.email as string),
            eq(users.role, "admin")
          ))
          .limit(1)

        if (!user[0] || !user[0].password) return null

        // 验证密码
        const hashedPassword = await hashPassword(credentials.password as string)
        if (hashedPassword !== user[0].password) return null

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          image: user[0].image,
          role: user[0].role,
        } as any
      }
    })
  ]

  if (flags.enableGoogleLogin) {
    providers.push(GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    }))
  }
  if (flags.enableGithubLogin) {
    providers.push(GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID as string,
      clientSecret: env.GITHUB_CLIENT_SECRET as string,
    }))
  }

  return {
    ...authConfig,
    providers,
    adapter: D1Adapter(env.DB),
  }
});

export { getAuthFlags };
