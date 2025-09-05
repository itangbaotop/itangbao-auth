// src/app/api/auth/revoke/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { applications, refreshTokens } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and } from "drizzle-orm";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const params = await request.json();
  const { token, client_id, client_secret } = params;

  if (!token || !client_id) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  // 验证客户端
  const application = await db.select()
    .from(applications)
    .where(eq(applications.clientId, client_id))
    .limit(1);

  if (!application[0] || application[0].clientSecret !== client_secret) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  // 撤销 refresh token
  await db.update(refreshTokens)
    .set({ isRevoked: true, updatedAt: new Date() })
    .where(and(
      eq(refreshTokens.token, token),
      eq(refreshTokens.clientId, client_id)
    ));

  return NextResponse.json({}, { status: 200 });
}
