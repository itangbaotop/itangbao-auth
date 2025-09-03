// src/app/api/auth/verify-magic-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { magicLinks, users } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);

    // 验证魔法链接
    const magicLink = await db.select()
      .from(magicLinks)
      .where(and(
        eq(magicLinks.token, token),
        eq(magicLinks.email, email),
        eq(magicLinks.used, false)
      ))
      .limit(1);

    if (!magicLink[0]) {
      return NextResponse.json(
        { error: "无效的魔法链接" },
        { status: 400 }
      );
    }

    // 检查是否过期
    if (new Date() > magicLink[0].expires) {
      return NextResponse.json(
        { error: "魔法链接已过期" },
        { status: 400 }
      );
    }

    // 标记为已使用
    await db.update(magicLinks)
      .set({ used: true })
      .where(eq(magicLinks.id, magicLink[0].id));

    // 检查用户是否存在，不存在则创建
    let user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user[0]) {
      // 创建新用户
      const newUser = await db.insert(users).values({
        id: nanoid(),
        name: email.split('@')[0],
        email: email,
        role: "user",
        emailVerified: new Date(),
      }).returning();

      user = newUser;
    } else {
      // 更新邮箱验证状态
      await db.update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user[0].id));
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        role: user[0].role,
      }
    });
  } catch (error) {
    console.error("验证魔法链接失败:", error);
    return NextResponse.json(
      { error: "验证失败" },
      { status: 500 }
    );
  }
}
