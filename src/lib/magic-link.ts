// src/lib/magic-link.ts
import { nanoid } from "nanoid"
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge"

// 生成魔法链接令牌
export function generateMagicLinkToken(): string {
  return nanoid(32)
}

// 验证邮箱格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 发送魔法链接邮件
export async function sendMagicLinkEmail(email: string, token: string, baseUrl: string) {
  const magicUrl = `${baseUrl}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`
  const { host } = new URL(baseUrl)

  try {
    const { env } = await getCloudflareContext();
    const RESEND_API_KEY = env.RESEND_API_KEY as string | undefined;
    const SENDGRID_API_KEY = env.SENDGRID_API_KEY as string | undefined;
    const EMAIL_FROM = env.EMAIL_FROM as string | undefined;

    // 使用 Resend 发送邮件
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_FROM!,
          to: email,
          subject: `登录到 ${host}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">itangbao-auth</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">安全登录验证</p>
              </div>
              
              <div style="padding: 40px 20px; background: white;">
                <h2 style="color: #333; margin: 0 0 20px 0;">点击下方按钮登录</h2>
                <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                  您正在尝试登录到 <strong>${host}</strong>。点击下方按钮即可安全登录，无需输入密码。
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicUrl}" style="
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                  ">
                    🔐 安全登录
                  </a>
                </div>
                
                <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    <strong>安全提示：</strong><br>
                    • 此链接将在 10 分钟后过期<br>
                    • 如果您没有请求此邮件，请忽略它<br>
                    • 请勿将此链接分享给他人
                  </p>
                </div>
                
                <p style="color: #999; font-size: 12px; text-align: center; margin: 30px 0 0 0;">
                  如果按钮无法点击，请复制以下链接到浏览器：<br>
                  <span style="word-break: break-all;">${magicUrl}</span>
                </p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="margin: 0; color: #999; font-size: 12px;">
                  © 2024 itangbao-auth. 保留所有权利。
                </p>
              </div>
            </div>
          `,
          text: `登录到 ${host}\n\n点击以下链接登录：\n${magicUrl}\n\n此链接将在10分钟后过期。如果您没有请求此邮件，请忽略它。`,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Resend API error:', error)
        throw new Error('Failed to send email via Resend')
      }

      return true
    }
    // 使用 SendGrid
    else if (SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email }],
            subject: `登录到 ${host}`,
          }],
          from: { email: EMAIL_FROM! },
          content: [
            {
              type: 'text/plain',
              value: `登录到 ${host}\n\n点击以下链接登录：\n${magicUrl}\n\n此链接将在10分钟后过期。`,
            },
            {
              type: 'text/html',
              value: `<h2>登录到 ${host}</h2><p>点击链接登录：</p><a href="${magicUrl}">登录</a><p>此链接将在10分钟后过期。</p>`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('SendGrid API error:', error)
        throw new Error('Failed to send email via SendGrid')
      }

      return true
    }
    else {
      throw new Error('No email service configured')
    }
  } catch (error) {
    console.error('Failed to send magic link email:', error)
    throw error
  }
}
