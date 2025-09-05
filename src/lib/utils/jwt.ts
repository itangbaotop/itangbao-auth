// src/lib/utils/jwt.ts
import * as jose from 'jose'; // 导入 jose 库
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'edge'; // 确保在 Edge Runtime 中运行

// 延迟并从 Cloudflare 环境中获取 JWT 密钥，避免在 Edge 顶层引用 Node 的 process
async function getJwtSecret(): Promise<Uint8Array> {
  const { env } = await getCloudflareContext();
  const secret = env.NEXTAUTH_SECRET as string | undefined;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set. It is required for JWT signing.');
  }
  return new TextEncoder().encode(secret);
}

const JWT_ALG = 'HS256'; // 对称加密算法，例如 HMAC SHA256

// JWT 载荷的类型定义
// 包含了用户和应用相关的信息
export interface UserJwtPayload {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  image?: string | null;
  appId?: string; // 标识是哪个应用发起的请求，通常用于 JWT 的 Audience (aud) 字段
  // 可以在这里添加其他你希望包含在 JWT 中的用户属性
}

/**
 * 创建并签名一个 JWT (Access Token)。
 * 这个 JWT 包含了用户的身份信息，并由认证服务签发。
 *
 * @param payload 包含用户身份和应用信息的载荷
 * @param expiresIn JWT 的过期时间，例如 '1h', '7d', ' '30m'。默认为环境变量 JWT_EXPIRES_IN 或 '7d'。
 * @returns 签名的 JWT 字符串
 */
export async function signJwt(payload: UserJwtPayload, expiresIn?: string): Promise<string> {
  const { env } = await getCloudflareContext();
  // 从 CF 环境变量获取默认过期时间，如果未设置则默认为 '7d'
  const defaultExpiresIn = (env.JWT_EXPIRES_IN as string | undefined) || '7d';
  const finalExpiresIn = expiresIn || defaultExpiresIn;
  const secret = await getJwtSecret();

  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG }) // 设置保护头部，指定签名算法
    .setIssuedAt() // 设置签发时间 (iat)
    .setExpirationTime(finalExpiresIn) // 设置过期时间 (exp)
    .setAudience(payload.appId || 'default-app') // 设置受众 (aud)，通常是客户端应用的 appId
    .setIssuer('itangbao-auth') // 设置签发者 (iss)，即你的认证服务名称
    .sign(secret); // 使用密钥进行签名
}

/**
 * 验证并解码 JWT。
 * 客户端应用（或其后端）使用此函数来验证从认证服务接收到的 JWT。
 *
 * @param token JWT 字符串
 * @param expectedAudience 期望的受众 (appId)，用于验证 aud 字段。可选。
 * @returns 解码后的载荷 (UserJwtPayload)，如果验证失败则抛出 jose.errors.JWTInvalid 等错误
 */
export async function verifyJwt(token: string, expectedAudience?: string): Promise<UserJwtPayload> {
  const secret = await getJwtSecret();
  // 验证 JWT 的签名、过期时间、签发者和受众
  const { payload } = await jose.jwtVerify(token, secret, {
    algorithms: [JWT_ALG], // 验证签名算法
    issuer: 'itangbao-auth', // 验证签发者
    audience: expectedAudience, // 如果提供了期望的受众，则验证受众
  });

  return payload as unknown as UserJwtPayload; // 将载荷断言为 UserJwtPayload 类型
}

/**
 * (可选) 仅解码 JWT，不验证签名。
 * 主要用于在客户端快速获取 JWT 内容，但不要依赖其进行安全判断。
 * 安全判断必须使用 verifyJwt。
 *
 * @param token JWT 字符串
 * @returns 解码后的载荷，如果无法解码则返回 null
 */
export function decodeJwt(token: string): UserJwtPayload | null {
  try {
    const { payload } = jose.decodeJwt(token);
    return payload as UserJwtPayload;
  } catch (e) {
    console.error("解码 JWT 失败:", e);
    return null;
  }
}
