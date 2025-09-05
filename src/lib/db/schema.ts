// src/lib/db/schema.ts
import { sql } from "drizzle-orm"
import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core"

export const accounts = sqliteTable("accounts", {
  id: text("id").notNull(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(), // 驼峰！
  refresh_token: text("refresh_token"),                    // 下划线！
  access_token: text("access_token"),                      // 下划线！
  expires_at: integer("expires_at"),                       // 下划线！
  token_type: text("token_type"),                          // 下划线！
  scope: text("scope"),
  id_token: text("id_token"),                              // 下划线！
  session_state: text("session_state"),                    // 下划线！
  oauth_token_secret: text("oauth_token_secret"),          // 下划线！
  oauth_token: text("oauth_token")                         // 下划线！
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId]
  })
}));

// sessions 表
export const sessions = sqliteTable("sessions", {
  id: text("id").notNull().primaryKey(),
  sessionToken: text("sessionToken").notNull(),           // 驼峰！
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull()
});

// users 表
export const users = sqliteTable("users", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }), // 驼峰！
  image: text("image"),
  password: text("password"),
  role: text("role").default("user"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
});

// 新增：应用管理表
export const applications = sqliteTable("applications", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  domain: text("domain").notNull().unique(), // 应用域名
  redirectUris: text("redirect_uris").notNull(), // JSON 数组存储多个回调地址
  clientId: text("client_id").notNull().unique(),
  clientSecret: text("client_secret").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
})

// 授权码表
export const authorizationCodes = sqliteTable("authorization_codes", {
  id: text("id").notNull().primaryKey(), // 授权码本身的 ID
  code: text("code").notNull().unique(), // 实际发放给客户端的授权码字符串
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull().references(() => applications.clientId, { onDelete: "cascade" }),
  redirectUri: text("redirect_uri").notNull(),
  scope: text("scope"), // 请求的权限范围
  state: text("state"), // 客户端提供的 state
  codeChallenge: text("code_challenge"), // PKCE code_challenge
  codeChallengeMethod: text("code_challenge_method"), // PKCE code_challenge_method
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(), // 过期时间
  isUsed: integer("is_used", { mode: "boolean" }).default(false), // 是否已使用
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// 新增：应用的第三方登录配置
export const appOAuthConfigs = sqliteTable("app_oauth_configs", {
  id: text("id").notNull().primaryKey(),
  appId: text("app_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // google, github, etc.
  clientId: text("client_id").notNull(),
  clientSecret: text("client_secret").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
})

// 新增：用户授权记录（用户对哪些应用进行了授权）
export const userAppAuthorizations = sqliteTable("user_app_authorizations", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  appId: text("app_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  scopes: text("scopes").notNull(), // JSON 数组存储授权范围
  authorizedAt: integer("authorized_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
})

export const verificationTokens = sqliteTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey(vt.identifier, vt.token),
}))

export const magicLinks = sqliteTable("magic_links", {
  id: text("id").notNull().primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
  used: integer("used", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
})