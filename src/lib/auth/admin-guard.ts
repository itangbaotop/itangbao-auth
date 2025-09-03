// src/lib/auth/admin-guard.ts
import { auth } from "./config";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function requireAdmin() {
  const session = await auth();
  
  if (!session?.user?.email) {
    throw new Error("未登录");
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  
  const user = await db.select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user[0] || user[0].role !== "admin") {
    throw new Error("权限不足");
  }

  return user[0];
}
