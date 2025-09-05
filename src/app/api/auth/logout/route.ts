// src/app/api/auth/unified-logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { refreshTokens } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and } from "drizzle-orm";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  console.log("--- /api/auth/unified-logout called ---");
  
  try {
    const body = await request.json();
    const { user_id, client_id, global_logout = true } = body;

    if (!user_id) {
      return NextResponse.json({ 
        error: 'invalid_request', 
        error_description: 'user_id is required' 
      }, { status: 400 });
    }

    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);

    // 1. 撤销 OAuth refresh tokens
    if (global_logout) {
      // 撤销用户的所有 refresh tokens
      await db.update(refreshTokens)
        .set({ isRevoked: true, updatedAt: new Date() })
        .where(and(
          eq(refreshTokens.userId, user_id),
          eq(refreshTokens.isRevoked, false)
        ));
    } else if (client_id) {
      // 只撤销特定应用的 refresh tokens
      await db.update(refreshTokens)
        .set({ isRevoked: true, updatedAt: new Date() })
        .where(and(
          eq(refreshTokens.userId, user_id),
          eq(refreshTokens.clientId, client_id),
          eq(refreshTokens.isRevoked, false)
        ));
    }

    // 2. 创建响应并清理 NextAuth cookies
    const response = NextResponse.json({
      message: 'unified_logout_success',
      logged_out: true,
      oauth_tokens_revoked: true,
      session_cleared: true,
      user_id: user_id
    });

    // 清理所有 NextAuth 相关的 cookies
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ];

    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    console.log(`Unified logout: 用户 ${user_id} 完全退出登录`);
    return response;

  } catch (error) {
    console.error("Unified logout error:", error);
    return NextResponse.json({ 
      error: 'server_error',
      error_description: 'Internal server error' 
    }, { status: 500 });
  }
}
