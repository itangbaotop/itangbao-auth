// src/app/api/admin/oauth-configs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getDb } from "@/lib/db";
import { appOAuthConfigs } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

export const runtime = "edge";

// 获取所有 OAuth 配置
export async function GET() {
  try {
    await requireAdmin();
    
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    const configs = await db.select({
      id: appOAuthConfigs.id,
      provider: appOAuthConfigs.provider,
      clientId: appOAuthConfigs.clientId,
      // 不返回 clientSecret 以保证安全
      isEnabled: appOAuthConfigs.isEnabled,
      createdAt: appOAuthConfigs.createdAt,
      updatedAt: appOAuthConfigs.updatedAt,
    }).from(appOAuthConfigs);
    
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取配置失败" },
      { status: 403 }
    );
  }
}

// 创建或更新 OAuth 配置
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    const body = await request.json();
    const { provider, clientId, clientSecret, isEnabled = true } = body;
    
    if (!provider || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    // 检查是否已存在该提供商的配置
    const existingConfig = await db.select()
      .from(appOAuthConfigs)
      .where(eq(appOAuthConfigs.provider, provider))
      .limit(1);

    if (existingConfig[0]) {
      // 更新现有配置
      const updatedConfig = await db.update(appOAuthConfigs)
        .set({
          clientId,
          clientSecret,
          isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(appOAuthConfigs.id, existingConfig[0].id))
        .returning({
          id: appOAuthConfigs.id,
          provider: appOAuthConfigs.provider,
          clientId: appOAuthConfigs.clientId,
          isEnabled: appOAuthConfigs.isEnabled,
          createdAt: appOAuthConfigs.createdAt,
          updatedAt: appOAuthConfigs.updatedAt,
        });
      
      return NextResponse.json(updatedConfig[0]);
    } else {
      // 创建新配置
      const newConfig = await db.insert(appOAuthConfigs).values({
        id: nanoid(),
        provider,
        clientId,
        clientSecret,
        isEnabled,
      }).returning({
        id: appOAuthConfigs.id,
        provider: appOAuthConfigs.provider,
        clientId: appOAuthConfigs.clientId,
        isEnabled: appOAuthConfigs.isEnabled,
        createdAt: appOAuthConfigs.createdAt,
        updatedAt: appOAuthConfigs.updatedAt,
      });
      
      return NextResponse.json(newConfig[0]);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存配置失败" },
      { status: 500 }
    );
  }
}
