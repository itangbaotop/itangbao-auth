// src/app/api/auth/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { applications, authorizationCodes, users, refreshTokens } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and, gt } from "drizzle-orm";
import { signJwt, verifyJwt } from "@/lib/utils/jwt";
import { nanoid } from "nanoid";

export const runtime = "edge";

async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 生成 refresh token
async function generateRefreshToken(userId: string, clientId: string, scope: string, db: any) {
  const refreshToken = nanoid(64); // 生成随机字符串
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30天过期

  await db.insert(refreshTokens).values({
    id: nanoid(),
    token: refreshToken,
    userId,
    clientId,
    scope,
    expiresAt,
    isRevoked: false,
  });

  return refreshToken;
}

// 处理 authorization_code grant
async function handleAuthorizationCode(params: any, db: any) {
  const { code, redirect_uri, client_id, client_secret, code_verifier } = params;

  // 验证参数
  if (!code || !client_id || !redirect_uri) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // 查找授权码
  const authCodeRecord = await db.select()
    .from(authorizationCodes)
    .where(and(
      eq(authorizationCodes.code, code),
      eq(authorizationCodes.clientId, client_id),
      eq(authorizationCodes.redirectUri, redirect_uri),
      eq(authorizationCodes.isUsed, false),
      gt(authorizationCodes.expiresAt, new Date())
    ))
    .limit(1);

  if (!authCodeRecord[0]) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }

  // 验证客户端
  const application = await db.select()
    .from(applications)
    .where(eq(applications.clientId, client_id))
    .limit(1);

  if (!application[0] || application[0].clientSecret !== client_secret) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  // PKCE 验证
  if (authCodeRecord[0].codeChallenge && code_verifier) {
    if (authCodeRecord[0].codeChallengeMethod === 'S256') {
      const hashedCodeVerifier = await sha256(code_verifier);
      if (hashedCodeVerifier !== authCodeRecord[0].codeChallenge) {
        return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
      }
    }
  }

  // 标记授权码为已使用
  await db.update(authorizationCodes)
    .set({ isUsed: true, updatedAt: new Date() })
    .where(eq(authorizationCodes.id, authCodeRecord[0].id));

  // 获取用户信息
  const user = await db.select()
    .from(users)
    .where(eq(users.id, authCodeRecord[0].userId))
    .limit(1);

  if (!user[0]) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // 生成 access token
  const jwtPayload = {
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    role: user[0].role,
    image: user[0].image,
    appId: client_id,
  };

  const access_token = await signJwt(jwtPayload, process.env.JWT_EXPIRES_IN || '15m');
  
  // 生成 refresh token
  const refresh_token = await generateRefreshToken(
    user[0].id, 
    client_id, 
    authCodeRecord[0].scope, 
    db
  );

  return NextResponse.json({
    access_token,
    token_type: 'Bearer',
    expires_in: 900,
    refresh_token,
    scope: authCodeRecord[0].scope,
    userinfo: {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      image: user[0].image,
      // 其他需要的用户信息
    }
  });
}

// 处理 refresh_token grant
async function handleRefreshToken(params: any, db: any) {
  const { refresh_token, client_id, client_secret, scope } = params;

  if (!refresh_token || !client_id) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // 验证客户端
  const application = await db.select()
    .from(applications)
    .where(eq(applications.clientId, client_id))
    .limit(1);

  if (!application[0] || application[0].clientSecret !== client_secret) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  // 查找 refresh token
  const refreshTokenRecord = await db.select()
    .from(refreshTokens)
    .where(and(
      eq(refreshTokens.token, refresh_token),
      eq(refreshTokens.clientId, client_id),
      eq(refreshTokens.isRevoked, false),
      gt(refreshTokens.expiresAt, new Date())
    ))
    .limit(1);

  if (!refreshTokenRecord[0]) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }

  // 获取用户信息
  const user = await db.select()
    .from(users)
    .where(eq(users.id, refreshTokenRecord[0].userId))
    .limit(1);

  if (!user[0]) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // 生成新的 access token
  const jwtPayload = {
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    role: user[0].role,
    image: user[0].image,
    appId: client_id,
  };

  const access_token = await signJwt(jwtPayload, process.env.JWT_EXPIRES_IN || '15m');

  // 可选：生成新的 refresh token（轮换策略）
  const new_refresh_token = await generateRefreshToken(
    user[0].id,
    client_id,
    refreshTokenRecord[0].scope,
    db
  );

  // 撤销旧的 refresh token
  await db.update(refreshTokens)
    .set({ isRevoked: true, updatedAt: new Date() })
    .where(eq(refreshTokens.id, refreshTokenRecord[0].id));

  return NextResponse.json({
    access_token,
    token_type: 'Bearer',
    expires_in: 900,
    refresh_token: new_refresh_token,
    scope: refreshTokenRecord[0].scope,
  });
}

export async function POST(request: NextRequest) {
  console.log("--- /api/auth/token called ---");
  const params = await request.json();
  const grant_type = params.grant_type;

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  console.log("Token: Received params:", params);

  switch (grant_type) {
    case 'authorization_code':
      return handleAuthorizationCode(params, db);
    
    case 'refresh_token':
      return handleRefreshToken(params, db);
    
    default:
      return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }
}
