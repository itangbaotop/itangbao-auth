// src/lib/db/queries.ts - 修复 any 类型错误
import { eq, and, gt, lt, desc, asc, sql, inArray, like, or, ne } from "drizzle-orm"
import { getDB } from "@/lib/db"
import { users, sessions, accounts, applications, oauthCodes, verificationTokens } from "./schema"
import type { 
  User, NewUser, 
  Session, 
  Account, 
  Application, 
  OAuthCode, 
  VerificationToken 
} from "./schema"

export class DatabaseQueries {
  // ==========================================
  // User 相关方法
  // ==========================================
  
  async getUserById(id: string): Promise<User | null> {
    const db = await getDB();
    const [user] = db.select().from(users).where(eq(users.id, id))
    return user || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await getDB();
    const [user] = db.select().from(users).where(eq(users.email, email))
    return user || null
  }

  async createUser(userData: NewUser): Promise<User> {
    const db = await getDB();
    const [user] = db.insert(users).values({
      ...userData,
      role: userData.role || 'user', // <-- 确保设置 role
    }).returning()
    return user
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const db = await getDB();
    const [user] = db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return user
  }

  async deleteUser(id: string): Promise<void> {
    const db = await getDB();
    db.delete(users).where(eq(users.id, id))
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return []
    const db = await getDB();
    return db.select().from(users).where(inArray(users.id, ids))
  }

  async searchUsers(query: string, limit: number = 50): Promise<User[]> {
    const db = await getDB();
    return db
      .select()
      .from(users)
      .where(
        or(
          like(users.email, `%${query}%`),
          like(users.name, `%${query}%`)
        )
      )
      .limit(limit)
  }

  async getUsersPaginated(
    page: number = 1, 
    limit: number = 20, 
    search?: string,
    sortBy: 'createdAt' | 'email' | 'name' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    const db = await getDB();
    const offset = (page - 1) * limit
    
    let whereClause = undefined
    if (search) {
      whereClause = or(
        like(users.email, `%${search}%`),
        like(users.name, `%${search}%`)
      )
    }

    const orderByColumn = users[sortBy]
    const orderBy = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn)

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause)
    ])

    return {
      data,
      total: totalResult[0].count,
      page,
      limit,
      totalPages: Math.ceil(totalResult[0].count / limit),
    }
  }

  // ==========================================
  // Account 相关方法（OAuth 账户关联）
  // ==========================================

  async linkAccount(accountData: {
    id: string
    userId: string
    type: string
    provider: string
    providerAccountId: string
    refreshToken?: string
    accessToken?: string
    expiresAt?: number
    tokenType?: string
    scope?: string
    idToken?: string
  }): Promise<Account> {
    const db = await getDB();
    const [account] = db.insert(accounts).values({
      ...accountData,
      createdAt: new Date(), // 添加创建时间
    }).returning()
    return account
  }

  async unlinkAccount(provider: string, providerAccountId: string): Promise<void> {
    const db = await getDB();
    db
      .delete(accounts)
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId)
        )
      )
  }

  async getAccountByProvider(provider: string, providerAccountId: string): Promise<Account | null> {
    const db = await getDB();
    const [account] = db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId)
        )
      )
    return account || null
  }

  async getUserAccounts(userId: string): Promise<Account[]> {
    const db = await getDB();
    return db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(accounts.provider)
  }

  async updateOrCreateAccount(accountData: {
    userId: string
    provider: string
    providerAccountId: string
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }): Promise<Account> {
    const db = await getDB();
    const existing = await this.getAccountByProvider(accountData.provider, accountData.providerAccountId)
    
    if (existing) {
      const [updated] = db
        .update(accounts)
        .set({
          accessToken: accountData.accessToken,
          refreshToken: accountData.refreshToken,
          expiresAt: accountData.expiresAt,
        })
        .where(eq(accounts.id, existing.id))
        .returning()
      return updated
    } else {
      return await this.linkAccount({
        id: crypto.randomUUID(),
        userId: accountData.userId,
        type: 'oauth',
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
        accessToken: accountData.accessToken,
        refreshToken: accountData.refreshToken,
        expiresAt: accountData.expiresAt,
      })
    }
  }

  async deleteUserAccounts(userId: string): Promise<void> {
    const db = await getDB();
    db.delete(accounts).where(eq(accounts.userId, userId))
  }

  // ==========================================
  // Session 相关方法
  // ==========================================

  async createSession(sessionData: {
    id: string
    sessionToken: string
    userId: string
    expires: Date
    userAgent?: string
    ipAddress?: string
  }): Promise<Session> {
    const db = await getDB();
    const [session] = db.insert(sessions).values({
      ...sessionData,
      createdAt: new Date(),
    }).returning()
    return session
  }

  async getSessionById(id: string): Promise<Session | null> {
    const db = await getDB();
    const [session] = db.select().from(sessions).where(eq(sessions.id, id))
    return session || null
  }

  async getSessionByToken(sessionToken: string): Promise<(Session & { user: User }) | null> {
    const db = await getDB();
    const [result] = db
      .select({
        sessions: sessions,
        users: users
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.sessionToken, sessionToken),
          gt(sessions.expires, new Date())
        )
      )

    return result ? { ...result.sessions, user: result.users } : null
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const db = await getDB();
    return db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          gt(sessions.expires, new Date())
        )
      )
      .orderBy(desc(sessions.createdAt))
  }

  async updateSession(sessionToken: string, updates: Partial<Session>): Promise<Session | null> {
    const db = await getDB();
    const [session] = db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.sessionToken, sessionToken))
      .returning()
    return session || null
  }

  async deleteSession(sessionToken: string): Promise<void> {
    const db = await getDB();
    db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))
  }

  async deleteSessionById(sessionId: string): Promise<void> {
    const db = await getDB();
    db.delete(sessions).where(eq(sessions.id, sessionId))
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const db = await getDB();
    db.delete(sessions).where(eq(sessions.userId, userId))
  }

  async deleteOtherUserSessions(userId: string, currentSessionToken: string): Promise<void> {
    const db = await getDB();
    db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          ne(sessions.sessionToken, currentSessionToken)
        )
      )
  }

  async getExpiredSessions(): Promise<Session[]> {
    const db = await getDB();
    return db
      .select()
      .from(sessions)
      .where(lt(sessions.expires, new Date()))
  }

  // ==========================================
  // Application 相关方法
  // ==========================================

  async createApplication(appData: {
    id: string
    name: string
    clientId: string
    clientSecret: string
    redirectUris: string[]
    userId: string
    scopes?: string[]
  }): Promise<Application> {
    const db = await getDB();
    const [app] = db.insert(applications).values({
      ...appData,
      scopes: appData.scopes || ['openid', 'profile', 'email'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()
    return app
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const db = await getDB();
    const [app] = db.select().from(applications).where(eq(applications.id, id))
    return app || null
  }

  async getApplicationByClientId(clientId: string): Promise<Application | null> {
    const db = await getDB();
    const [app] = db
      .select()
      .from(applications)
      .where(eq(applications.clientId, clientId))
    return app || null
  }

  async getUserApplications(userId: string): Promise<Application[]> {
    const db = await getDB();
    return db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt))
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const db = await getDB();
    const [app] = db
      .update(applications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning()
    return app
  }

  async deleteApplication(id: string): Promise<void> {
    const db = await getDB();
    db.delete(applications).where(eq(applications.id, id))
  }

  async getAllApplications(limit?: number): Promise<Application[]> {
    const db = await getDB();
    let query = db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt))
      .$dynamic();
    
    if (limit) {
      query = query.limit(limit)
    }
    
    return await query
  }

  async searchApplications(query: string, limit: number = 50): Promise<Application[]> {
    const db = await getDB();
    return db
      .select()
      .from(applications)
      .where(like(applications.name, `%${query}%`))
      .limit(limit)
  }

  // ==========================================
  // OAuth Code 相关方法
  // ==========================================

  async createOAuthCode(codeData: {
    id: string
    code: string
    userId: string
    applicationId: string
    redirectUri: string
    scopes: string[]
    expiresAt: Date
    codeChallenge?: string
    codeChallengeMethod?: string
  }): Promise<OAuthCode> {
    const db = await getDB();
    const [oauthCode] = db.insert(oauthCodes).values({
      ...codeData,
      used: false,
      createdAt: new Date(),
    }).returning()
    return oauthCode
  }

  async getOAuthCode(code: string) {
    const db = await getDB();
    const [result] = db
      .select({
        oauth_codes: oauthCodes,
        users: users,
        applications: applications
      })
      .from(oauthCodes)
      .innerJoin(users, eq(oauthCodes.userId, users.id))
      .innerJoin(applications, eq(oauthCodes.applicationId, applications.id))
      .where(
        and(
          eq(oauthCodes.code, code),
          eq(oauthCodes.used, false),
          gt(oauthCodes.expiresAt, new Date())
        )
      )

    return result ? {
      ...result.oauth_codes,
      user: result.users,
      application: result.applications
    } : null
  }

  async markOAuthCodeAsUsed(code: string): Promise<void> {
    const db = await getDB();
    db
      .update(oauthCodes)
      .set({ used: true })
      .where(eq(oauthCodes.code, code))
  }

  async deleteOAuthCode(code: string): Promise<void> {
    const db = await getDB();
    db.delete(oauthCodes).where(eq(oauthCodes.code, code))
  }

  async getUserOAuthCodes(userId: string): Promise<OAuthCode[]> {
    const db = await getDB();
    return db
      .select()
      .from(oauthCodes)
      .where(eq(oauthCodes.userId, userId))
      .orderBy(desc(oauthCodes.createdAt))
  }

  async getApplicationOAuthCodes(applicationId: string): Promise<OAuthCode[]> {
    const db = await getDB();
    return db
      .select()
      .from(oauthCodes)
      .where(eq(oauthCodes.applicationId, applicationId))
      .orderBy(desc(oauthCodes.createdAt))
  }

  // ==========================================
  // Verification Token 相关方法
  // ==========================================

  async createVerificationToken(data: {
    identifier: string
    token: string
    expires: Date
    type: string
  }): Promise<VerificationToken> {
    const db = await getDB();
    const [verificationToken] = db.insert(verificationTokens).values({
      ...data,
      createdAt: new Date(),
    }).returning()
    return verificationToken
  }

  async getVerificationToken(identifier: string, token: string): Promise<VerificationToken | null> {
    const db = await getDB();
    const [verificationToken] = db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token),
          gt(verificationTokens.expires, new Date())
        )
      )
    return verificationToken || null
  }

  async useVerificationToken(identifier: string, token: string): Promise<boolean> {
    const db = await getDB();
    const verificationToken = await this.getVerificationToken(identifier, token)
    if (!verificationToken) return false

    db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        )
      )

    return true
  }

  async deleteVerificationToken(identifier: string, token: string): Promise<void> {
    const db = await getDB();
    db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        )
      )
  }

  async getUserVerificationTokens(identifier: string): Promise<VerificationToken[]> {
    const db = await getDB();
    return db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier))
      .orderBy(desc(verificationTokens.createdAt))
  }

  // ==========================================
  // 统计和分析方法
  // ==========================================

  async getUserStats(userId: string): Promise<{
    totalApplications: number
    totalSessions: number
    totalAccounts: number
    lastLogin?: Date
  }> {
    const db = await getDB();

    const [appCountResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(eq(applications.userId, userId))

    const [sessionCountResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          gt(sessions.expires, new Date())
        )
      )

    const [accountCountResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(eq(accounts.userId, userId))

    const [lastSession] = db
      .select({ createdAt: sessions.createdAt })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt))
      .limit(1)

    return {
      totalApplications: appCountResult.count,
      totalSessions: sessionCountResult.count,
      totalAccounts: accountCountResult.count,
      lastLogin: lastSession?.createdAt ?? undefined,
    }
  }

  async getSystemStats(): Promise<{
    totalUsers: number
    totalApplications: number
    activeSessions: number
    totalOAuthCodes: number
    newUsersToday: number
    activeUsersToday: number
  }> {
    const db = await getDB();
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalUsersResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(users)

    const [totalApplicationsResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(applications)

    const [activeSessionsResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(gt(sessions.expires, new Date()))

    const [totalOAuthCodesResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(oauthCodes)
      .where(
        and(
          eq(oauthCodes.used, false),
          gt(oauthCodes.expiresAt, new Date())
        )
      )

    const [newUsersTodayResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gt(users.createdAt, today))

    const activeUsersTodayResults = db
      .selectDistinct({ userId: sessions.userId })
      .from(sessions)
      .where(gt(sessions.createdAt, today))

    return {
      totalUsers: totalUsersResult.count,
      totalApplications: totalApplicationsResult.count,
      activeSessions: activeSessionsResult.count,
      totalOAuthCodes: totalOAuthCodesResult.count,
      newUsersToday: newUsersTodayResult.count,
      activeUsersToday: activeUsersTodayResults.length,
    }
  }

  async getApplicationStats(applicationId: string): Promise<{
    totalUsers: number
    totalCodes: number
    lastUsed?: Date
    topUsers: Array<{ userId: string; count: number }>
  }> {
    const db = await getDB();

    const userCountResults = db
      .selectDistinct({ userId: oauthCodes.userId })
      .from(oauthCodes)
      .where(eq(oauthCodes.applicationId, applicationId))

    const [codeCountResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(oauthCodes)
      .where(eq(oauthCodes.applicationId, applicationId))

    const [lastUsedResult] = db
      .select({ createdAt: oauthCodes.createdAt })
      .from(oauthCodes)
      .where(eq(oauthCodes.applicationId, applicationId))
      .orderBy(desc(oauthCodes.createdAt))
      .limit(1)

    const topUsers = db
      .select({
        userId: oauthCodes.userId,
        count: sql<number>`count(*)`,
      })
      .from(oauthCodes)
      .where(eq(oauthCodes.applicationId, applicationId))
      .groupBy(oauthCodes.userId)
      .orderBy(sql`count(*) desc`)
      .limit(10)

    return {
      totalUsers: userCountResults.length,
      totalCodes: codeCountResult.count,
      lastUsed: lastUsedResult?.createdAt ?? undefined,
      topUsers: topUsers,
    }
  }

  // ==========================================
  // 清理和维护方法
  // ==========================================

  async cleanupExpiredSessions(): Promise<number> {
    const db = await getDB();
    const result = db
      .delete(sessions)
      .where(lt(sessions.expires, new Date()))

    return (result as D1Result).meta?.changes || 0
  }

  async cleanupExpiredVerificationTokens(): Promise<number> {
    const db = await getDB();
    const result = db
      .delete(verificationTokens)
      .where(lt(verificationTokens.expires, new Date()))

    return (result as D1Result).meta?.changes || 0
  }

  async cleanupExpiredOAuthCodes(): Promise<number> {
    const db = await getDB();
    const result = db
      .delete(oauthCodes)
      .where(lt(oauthCodes.expiresAt, new Date()))

    return (result as D1Result).meta?.changes || 0
  }

  async cleanupUnusedOAuthCodes(olderThanHours: number = 24): Promise<number> {
    const db = await getDB();
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    
    const result = db
      .delete(oauthCodes)
      .where(
        and(
          eq(oauthCodes.used, false),
          lt(oauthCodes.createdAt, cutoffTime)
        )
      )

    return (result as D1Result).meta?.changes || 0
  }

  async cleanupOldSessions(olderThanDays: number = 90): Promise<number> {
    const db = await getDB();
    const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    
    const result = db
      .delete(sessions)
      .where(lt(sessions.createdAt, cutoffTime))

    return (result as D1Result).meta?.changes || 0
  }

  // ==========================================
  // 批量操作方法
  // ==========================================

  async batchCreateUsers(usersData: NewUser[]): Promise<User[]> {
    if (usersData.length === 0) return []
    const db = await getDB();
    return db.insert(users).values(usersData).returning()
  }

  async batchDeleteUsers(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return
    const db = await getDB();
    db.delete(users).where(inArray(users.id, userIds))
  }

  async batchDeleteSessions(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) return
    const db = await getDB();
    db.delete(sessions).where(inArray(sessions.id, sessionIds))
  }

  async batchUpdateUserEmailVerification(userIds: string[], verified: boolean): Promise<void> {
    if (userIds.length === 0) return
    const db = await getDB();
    db
      .update(users)
      .set({ 
        emailVerified: verified,
        updatedAt: new Date()
      })
      .where(inArray(users.id, userIds))
  }

  // ==========================================
  // 高级查询方法
  // ==========================================

  async getUsersWithRecentActivity(days: number = 30): Promise<User[]> {
    const db = await getDB();
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const results = db
      .selectDistinct({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(sessions, eq(users.id, sessions.userId))
      .where(gt(sessions.createdAt, cutoffTime))

    return results.map(result => result) as User[] // 明确映射为 User 类型
  }

  async getInactiveUsers(days: number = 90): Promise<User[]> {
    const db = await getDB();
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const activeUserIds = db
      .selectDistinct({ userId: sessions.userId })
      .from(sessions)
      .where(gt(sessions.createdAt, cutoffTime))

    const activeIds = activeUserIds.map(row => row.userId)
    
    if (activeIds.length === 0) {
      return db.select().from(users)
    }

    return db
      .select()
      .from(users)
      .where(
        and(
          lt(users.createdAt, cutoffTime),
          sql`${users.id} NOT IN (${inArray(users.id, activeIds)})` // 使用 inArray 替代手动拼接
        )
      )
  }

  async getUsersByProvider(provider: string): Promise<User[]> {
    const db = await getDB();
    const results = db
      .selectDistinct({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(accounts, eq(users.id, accounts.userId))
      .where(eq(accounts.provider, provider))

    return results.map(result => result) as User[] // 明确映射为 User 类型
  }

  async getApplicationsWithStats(): Promise<Array<Application & {
    userCount: number
    codeCount: number
    lastUsed?: Date
  }>> {
    const db = await getDB();
    const results = db
      .select({
        id: applications.id,
        name: applications.name,
        clientId: applications.clientId,
        clientSecret: applications.clientSecret,
        redirectUris: applications.redirectUris,
        scopes: applications.scopes,
        userId: applications.userId,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        userCount: sql<number>`count(distinct ${oauthCodes.userId})`,
        codeCount: sql<number>`count(${oauthCodes.id})`,
        lastUsed: sql<string | null>`max(${oauthCodes.createdAt})`, // 明确类型
      })
      .from(applications)
      .leftJoin(oauthCodes, eq(applications.id, oauthCodes.applicationId))
      .groupBy(applications.id)
      .orderBy(desc(applications.createdAt))

    return results.map(result => ({
      ...result,
      userCount: result.userCount || 0,
      codeCount: result.codeCount || 0,
      lastUsed: result.lastUsed ? new Date(result.lastUsed) : undefined,
    }))
  }
}

// 导出单例实例
export const db = new DatabaseQueries()