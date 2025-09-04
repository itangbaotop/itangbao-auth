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

// 获取 provider 的显示信息
function getProviderInfo(provider: string) {
  const providerMap = {
    github: {
      name: "GitHub",
      icon: Github,
      color: "bg-gray-900 dark:bg-gray-700",
      textColor: "text-white"
    },
    google: {
      name: "Google",
      icon: Chrome,
      color: "bg-red-500",
      textColor: "text-white"
    },
    email: {
      name: "邮箱",
      icon: Mail,
      color: "bg-blue-500",
      textColor: "text-white"
    },
    "admin-credentials": {
      name: "管理员账户",
      icon: Key,
      color: "bg-purple-500",
      textColor: "text-white"
    }
  };
  
  return providerMap[provider as keyof typeof providerMap] || {
    name: provider,
    icon: User,
    color: "bg-gray-500",
    textColor: "text-white"
  };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { user } = session;
  
  // 获取用户的登录账户
  const userAccounts = await getUserAccounts(user.id);

  // 获取用户名首字母作为头像 fallback
  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  // 格式化日期
  const formatDate = (date: Date | string | null) => {
    if (!date) return "未知";
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            个人资料
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            管理您的账户信息和偏好设置
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* 左侧：用户信息卡片 */}
          <div className="md:col-span-2 space-y-6">
            {/* 基本信息 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20 ring-4 ring-blue-100 dark:ring-blue-900">
                    <AvatarImage 
                      src={user.image || ""} 
                      alt={user.name || "用户头像"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                      {getInitials(user.name || "用户")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-slate-900 dark:text-slate-100 mb-1">
                      {user.name || "未设置姓名"}
                    </CardTitle>
                    <CardDescription className="text-base flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {user.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* 账户信息 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      用户名
                    </label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border">
                      <p className="text-slate-900 dark:text-slate-100">
                        {user.name || "未设置"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      邮箱地址
                    </label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border">
                      <p className="text-slate-900 dark:text-slate-100">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 邮箱验证状态 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    邮箱验证状态
                  </label>
                  <div className="flex items-center space-x-2">
                    {user.emailVerified ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ 已验证
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        ⚠ 未验证
                      </Badge>
                    )}
                    {user.emailVerified && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(user.emailVerified)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 登录方式 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  登录方式
                </CardTitle>
                <CardDescription>
                  您可以使用以下方式登录此账户
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userAccounts.length > 0 ? (
                    userAccounts.map((account, index) => {
                      const providerInfo = getProviderInfo(account.provider);
                      const IconComponent = providerInfo.icon;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${providerInfo.color}`}>
                              <IconComponent className={`h-4 w-4 ${providerInfo.textColor}`} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {providerInfo.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {account.type === 'oauth' ? 'OAuth 登录' : '凭据登录'}
                                {account.providerAccountId && ` • ID: ${account.providerAccountId}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            已连接
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                      未找到登录方式信息
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：操作面板 */}
          <div className="space-y-6">
            {/* 快速操作 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  快速操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                
                <form action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}>
                  <Button 
                    type="submit"
                    variant="destructive" 
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    退出登录
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 账户安全 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  账户安全
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      双因素认证
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      增强账户安全性
                    </p>
                  </div>
                  <Badge variant="secondary">
                    未启用
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      登录活动
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      查看最近登录记录
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    正常
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
