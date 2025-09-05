// src/app/auth/authorize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config"; // 导入 Auth.js 的认证函数
import { getDb } from "@/lib/db";
import { applications, authorizationCodes } from "@/lib/db/schema"; // 导入相关表
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const runtime = "edge";

// 用于 PKCE code_challenge_method=S256 的辅助函数
// 确保这个 sha256 实现只使用 Web Crypto API
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data); // 这是 Web Crypto API
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function GET(request: NextRequest) {
  console.log("--- /api/auth/authorize called ---");
  const url = new URL(request.url);
  const client_id = url.searchParams.get('client_id');
  const redirect_uri = url.searchParams.get('redirect_uri');
  const response_type = url.searchParams.get('response_type');
  const state = url.searchParams.get('state');
  const code_challenge = url.searchParams.get('code_challenge');
  const code_challenge_method = url.searchParams.get('code_challenge_method');

  console.log("Authorize Request Params:", { client_id, redirect_uri, response_type, state, code_challenge, code_challenge_method });

  // 1. 验证用户是否已登录
  const session = await auth();
  if (!session?.user) {
    console.warn("Authorize: 用户未登录，重定向到登录页");
    const signInUrl = new URL('/auth/signin', url.origin);
    // 将原始 OAuth 参数传递给登录页，以便登录成功后能回到这里
    if (client_id) signInUrl.searchParams.set('client_id', client_id);
    if (redirect_uri) signInUrl.searchParams.set('redirect_uri', redirect_uri);
    if (response_type) signInUrl.searchParams.set('response_type', response_type);
    if (state) signInUrl.searchParams.set('state', state);
    if (code_challenge) signInUrl.searchParams.set('code_challenge', code_challenge);
    if (code_challenge_method) signInUrl.searchParams.set('code_challenge_method', code_challenge_method);
    return NextResponse.redirect(signInUrl.toString());
  }
  console.log("Authorize: 用户已登录:", session.user.email);


  // 2. 验证 OAuth 参数
  if (!client_id || !redirect_uri || response_type !== 'code') {
    console.error("Authorize: 缺少必要的 OAuth 参数或 response_type 不正确");
    // 如果 redirect_uri 无效，重定向到认证服务自己的错误页
    return NextResponse.redirect(`${url.origin}/auth/error?message=${encodeURIComponent('OAuth 参数无效或缺少')}`);
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  // 3. 验证 client_id 和 redirect_uri 白名单
  const application = await db.select()
    .from(applications)
    .where(eq(applications.clientId, client_id))
    .limit(1);

  if (!application[0]) {
    console.error(`Authorize: 客户端应用 ${client_id} 不存在。`);
    return NextResponse.redirect(`${url.origin}/auth/error?message=${encodeURIComponent('客户端应用不存在')}`);
  }
  console.log("Authorize: 客户端应用找到:", application[0].name);

  const allowedUris: string[] = JSON.parse(application[0].redirectUris);
  if (!allowedUris.includes(redirect_uri)) {
    console.error(`Authorize: redirect_uri ${redirect_uri} 不在白名单中。`);
    return NextResponse.redirect(`${url.origin}/auth/error?message=${encodeURIComponent('回调地址未授权')}`);
  }
  console.log("Authorize: redirect_uri 在白名单中。");

  // 4. 生成授权码 (Authorization Code)
  const authorizationCode = nanoid(32); // 生成一个随机授权码
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 授权码 5 分钟内过期

  try {
    await db.insert(authorizationCodes).values({
      id: nanoid(),
      code: authorizationCode,
      userId: session.user.id as string,
      clientId: client_id as string,
      redirectUri: redirect_uri as string,
      scope: url.searchParams.get('scope') || null,
      state: state || null,
      codeChallenge: code_challenge || null,
      codeChallengeMethod: code_challenge_method || null,
      expiresAt: expiresAt,
      isUsed: false,
      createdAt: new Date(),
    });
    console.log("Authorize: 授权码存储成功:", authorizationCode);
  } catch (error) {
    console.error("Authorize: 存储授权码失败:", error);
    // 重定向到认证服务自己的错误页
    return NextResponse.redirect(`${url.origin}/auth/error?message=${encodeURIComponent('存储授权码失败')}`);
  }

  // 5. 重定向回客户端应用，携带授权码和 state
  const finalRedirectUrl = new URL(redirect_uri);
  finalRedirectUrl.searchParams.set('code', authorizationCode);
  if (state) {
    finalRedirectUrl.searchParams.set('state', state);
  }
  console.log("Authorize: 重定向回客户端应用:", finalRedirectUrl.toString());
  return NextResponse.redirect(finalRedirectUrl.toString());
}
