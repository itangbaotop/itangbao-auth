// src/app/api/user/info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/utils/jwt";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  // 1. 从 Authorization header 获取 token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  const accessToken = authHeader.substring(7); // 移除 "Bearer " 前缀

  try {
    // 2. 验证 JWT token
    const payload = await verifyJwt(accessToken);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    // 3. 从数据库获取最新用户信息
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    const user = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    // 4. 返回用户信息（符合 OpenID Connect UserInfo 规范）
    return NextResponse.json({
      sub: user[0].id,           // subject - 用户唯一标识
      name: user[0].name,
      email: user[0].email,
      picture: user[0].image,
      email_verified: !!user[0].emailVerified,
      role: user[0].role,        // 自定义字段
      created_at: user[0].createdAt,
    });

  } catch (error) {
    console.error('UserInfo: Token 验证失败:', error);
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }
}

// 支持 POST 方法（某些客户端可能使用 POST）
export async function POST(request: NextRequest) {
  return GET(request);
}
