// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'edge'

// 边缘环境兼容的密码哈希
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    const db = getDb((await getCloudflareContext({async: true})).env.DB);

    // 检查用户是否已存在
    const existingUser = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: '用户已存在' },
        { status: 409 }
      )
    }

    // 创建新用户
    const hashedPassword = await hashPassword(password)
    const userId = crypto.randomUUID()

    await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      name: name || null,
      role: 'user'
    })

    return NextResponse.json(
      { message: '注册成功', userId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '注册失败' },
      { status: 500 }
    )
  }
}

