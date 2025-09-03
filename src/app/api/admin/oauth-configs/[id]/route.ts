// src/app/api/admin/oauth-configs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getDb } from "@/lib/db";
import { appOAuthConfigs } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";

export const runtime = "edge";

// 删除 OAuth 配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    await db.delete(appOAuthConfigs)
      .where(eq(appOAuthConfigs.id, params.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除配置失败" },
      { status: 500 }
    );
  }
}

// 切换启用状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    const body = await request.json();
    const { isEnabled } = body;
    
    const updatedConfig = await db.update(appOAuthConfigs)
      .set({
        isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(appOAuthConfigs.id, params.id))
      .returning({
        id: appOAuthConfigs.id,
        provider: appOAuthConfigs.provider,
        clientId: appOAuthConfigs.clientId,
        isEnabled: appOAuthConfigs.isEnabled,
        updatedAt: appOAuthConfigs.updatedAt,
      });
    
    if (!updatedConfig[0]) {
      return NextResponse.json(
        { error: "配置不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedConfig[0]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新配置失败" },
      { status: 500 }
    );
  }
}
