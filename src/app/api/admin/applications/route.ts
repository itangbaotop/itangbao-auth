// src/app/api/admin/applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getDb } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const runtime = "edge";

// 获取所有应用
export async function GET() {
  try {
    await requireAdmin();
    
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    const apps = await db.select().from(applications);
    
    return NextResponse.json(apps);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取应用列表失败" },
      { status: 403 }
    );
  }
}

// 创建新应用
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    const body = await request.json();
    const { name, description, domain, redirectUris } = body;
    
    if (!name || !domain || !redirectUris) {
      return NextResponse.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }
    
    const clientId = nanoid(32);
    const clientSecret = nanoid(64);
    
    const newApp = await db.insert(applications).values({
      id: nanoid(),
      name,
      description: description || "",
      domain,
      redirectUris: JSON.stringify(redirectUris),
      clientId,
      clientSecret,
      createdBy: admin.id,
    }).returning();
    
    return NextResponse.json(newApp[0]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建应用失败" },
      { status: 500 }
    );
  }
}
