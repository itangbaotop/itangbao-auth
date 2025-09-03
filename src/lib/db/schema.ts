// src/lib/db/schema.ts
import { sql } from "drizzle-orm"
import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core"

// 现有的 users 表保持不变
export const users = sqliteTable("users", {
  id: text("id").notNull().primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  name: text("name"),
  image: text("image"),
  password: text("password"),
  role: text("role", { enum: ['user', 'admin'] }).default('user').notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
})

// 现有的 accounts 表保持不变
export const accounts = sqliteTable("accounts", {
  id: text("id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state")
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId]
  })
}))

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

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
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