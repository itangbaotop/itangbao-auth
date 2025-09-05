// src/app/api/auth/send-magic-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { magicLinks } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { generateMagicLinkToken, isValidEmail, sendMagicLinkEmail } from "@/lib/magic-link";
import { nanoid } from "nanoid";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "请提供有效的邮箱地址" },
        { status: 400 }
      );
    }

    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);

    // 生成魔法链接令牌
    const token = generateMagicLinkToken();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 保存到数据库
    await db.insert(magicLinks).values({
      id: nanoid(),
      email,
      token,
      expires,
      used: false,
    });

    // 发送邮件
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    await sendMagicLinkEmail(email, token, baseUrl);

    return NextResponse.json({ 
      success: true,
      message: "魔法链接已发送到您的邮箱"
    });
  } catch (error) {
    console.error("发送魔法链接失败:", error);
    return NextResponse.json(
      { error: "发送失败，请重试" },
      { status: 500 }
    );
  }
}
