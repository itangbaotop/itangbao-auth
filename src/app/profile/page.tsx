// src/app/profile/page.tsx
import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mail, User, LogOut, Settings, Shield, Github, Chrome, Key } from "lucide-react";
import { getDb } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ProfileContent } from "@/components/ProfileContent";

// 获取用户的登录账户信息
async function getUserAccounts(userId: string) {
  try {
    const context = getCloudflareContext();
    const db = getDb(context.env.DB);
    
    const userAccounts = await db.select({
      provider: accounts.provider,
      type: accounts.type,
      providerAccountId: accounts.providerAccountId,
    }).from(accounts).where(eq(accounts.userId, userId));
    
    return userAccounts;
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    return [];
  }
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { user } = session;
  
  // 获取用户的登录账户
  const userAccounts = await getUserAccounts(user.id);

  return <ProfileContent user={user} userAccounts={userAccounts} />;
}
