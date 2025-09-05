// src/app/api/auth/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { applications, authorizationCodes, users } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and, gt } from "drizzle-orm";
import { signJwt } from "@/lib/utils/jwt"; // 确保导入 signJwt

export const runtime = "edge";

// 用于 PKCE code_challenge_method=S256 的辅助函数
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data); // 这是 Web Crypto API
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function POST(request: NextRequest) {
  console.log("--- /api/auth/token called ---");
  const params = await request.json(); // 通常是 application/x-www-form-urlencoded，但 Edge Runtime 支持 .json()

  const grant_type = params.grant_type;
  const code = params.code;
  const redirect_uri = params.redirect_uri;
  const client_id = params.client_id;
  const client_secret = params.client_secret; // 如果客户端是机密的
  const code_verifier = params.code_verifier; // PKCE

  // 1. 验证 grant_type
  if (grant_type !== 'authorization_code') {
    console.error("Token: grant_type 无效");
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }

  // 2. 验证 code, client_id, redirect_uri
  if (!code || !client_id || !redirect_uri) {
    console.error("Token: 缺少必要的参数");
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  console.log("Token: Received params:", { grant_type, code, redirect_uri, client_id, client_secret, code_verifier });
  // 3. 查找并验证授权码
  const authCodeRecord = await db.select()
    .from(authorizationCodes)
    .where(and(
      eq(authorizationCodes.code, code),
      eq(authorizationCodes.clientId, client_id),
      eq(authorizationCodes.redirectUri, redirect_uri),
      eq(authorizationCodes.isUsed, false), // 必须是未使用的
      gt(authorizationCodes.expiresAt, new Date()) // 必须未过期
    ))
    .limit(1);

    console.log("Token: Fetched auth code record:", authCodeRecord);

  if (!authCodeRecord[0]) {
    console.error("Token: 授权码无效或已过期/使用");
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }

  // 4. 验证 client_secret (如果应用是机密的)
  const application = await db.select()
    .from(applications)
    .where(eq(applications.clientId, client_id))
    .limit(1);

  if (!application[0]) {
    console.error(`Token: 客户端应用 ${client_id} 不存在。`);
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  // 假设所有客户端都是机密的，需要 client_secret
  if (application[0].clientSecret !== client_secret) {
    console.error("Token: client_secret 不匹配。");
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  // 5. PKCE 验证 (如果存在 code_challenge)
  if (authCodeRecord[0].codeChallenge && code_verifier) {
    if (authCodeRecord[0].codeChallengeMethod === 'S256') {
      const hashedCodeVerifier = await sha256(code_verifier);
      if (hashedCodeVerifier !== authCodeRecord[0].codeChallenge) {
        console.error("Token: PKCE code_verifier 不匹配。");
        return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
      }
    } else {
      console.error("Token: 不支持的 code_challenge_method。");
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }
  } else if (authCodeRecord[0].codeChallenge && !code_verifier) {
    console.error("Token: 缺少 PKCE code_verifier。");
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // 6. 将授权码标记为已使用
  await db.update(authorizationCodes)
    .set({ isUsed: true, updatedAt: new Date() })
    .where(eq(authorizationCodes.id, authCodeRecord[0].id));

  // 7. 签发 Access Token (JWT)
  const user = await db.select()
    .from(users)
    .where(eq(users.id, authCodeRecord[0].userId))
    .limit(1);

  if (!user[0]) {
    console.error("Token: 未找到授权用户。");
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  const jwtPayload = {
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    role: user[0].role,
    image: user[0].image,
    appId: client_id, // JWT 的受众是客户端 ID
  };

  const access_token = await signJwt(jwtPayload, process.env.JWT_EXPIRES_IN || '1h'); // Access Token 通常短期

  console.log("Token: Access Token 签发成功。");
  return NextResponse.json({
    access_token: access_token,
    token_type: 'Bearer',
    expires_in: 3600, // Access Token 过期时间（秒），与 JWT_EXPIRES_IN 对应
    scope: authCodeRecord[0].scope, // 返回请求的 scope
  });
}
