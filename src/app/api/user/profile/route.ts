// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/utils/password";

export const runtime = "edge";

// 获取用户资料
export async function GET() {
  try {
    const session = await auth();
    console.log("session", session);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    const user = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
    
    if (!user[0]) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "获取用户资料失败" },
      { status: 500 }
    );
  }
}

// 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    
    const body = await request.json();
    const { name, currentPassword, newPassword } = body;
    
    // 如果要修改密码，需要验证当前密码
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "修改密码需要提供当前密码" },
          { status: 400 }
        );
      }
      
      // 验证当前密码
      const user = await db.select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);
        
      if (!user[0] || !user[0].password) {
        return NextResponse.json(
          { error: "用户密码验证失败" },
          { status: 400 }
        );
      }
      
      const hashedCurrentPassword = await hashPassword(currentPassword);
      if (hashedCurrentPassword !== user[0].password) {
        return NextResponse.json(
          { error: "当前密码错误" },
          { status: 400 }
        );
      }
      
      // 更新密码和姓名
      const hashedNewPassword = await hashPassword(newPassword);
      const updatedUser = await db.update(users)
        .set({
          name: name || user[0].name,
          password: hashedNewPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.email, session.user.email))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
        
      return NextResponse.json(updatedUser[0]);
    } else {
      // 只更新姓名
      const updatedUser = await db.update(users)
        .set({
          name: name,
          updatedAt: new Date(),
        })
        .where(eq(users.email, session.user.email))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
        
      return NextResponse.json(updatedUser[0]);
    }
  } catch (error) {
    return NextResponse.json(
      { error: "更新用户资料失败" },
      { status: 500 }
    );
  }
}
