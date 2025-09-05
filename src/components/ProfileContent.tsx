// src/components/ProfileContent.tsx
"use client";

import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, User, LogOut, Settings, Shield, Github, Chrome, Key } from "lucide-react";
import { signOut } from "next-auth/react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { I18nProvider } from "@/contexts/I18nProvider";

interface ProfileContentProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
  };
  userAccounts: Array<{
    provider: string;
    type: string;
    providerAccountId: string | null;
  }>;
}

function ProfileContentInner({ user, userAccounts }: ProfileContentProps) {
  const { t } = useTranslation(['profile', 'common']);

  // 获取 provider 的显示信息
  function getProviderInfo(provider: string) {
    const providerMap = {
      github: {
        name: t('profile:providers.GitHub'),
        icon: Github,
        color: "bg-gray-900 dark:bg-gray-700",
        textColor: "text-white"
      },
      google: {
        name: t('profile:providers.Google'),
        icon: Chrome,
        color: "bg-red-500",
        textColor: "text-white"
      },
      email: {
        name: t('profile:providers.email'),
        icon: Mail,
        color: "bg-blue-500",
        textColor: "text-white"
      },
      "admin-credentials": {
        name: t('profile:providers.admin-credentials'),
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
    if (!date) return t('profile:unknown');
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 页面标题和语言切换 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('profile:title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {t('profile:subtitle')}
            </p>
          </div>
          <LanguageSwitcher />
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
                      alt={user.name || t('profile:title')}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                      {getInitials(user.name || t('profile:title'))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-slate-900 dark:text-slate-100 mb-1">
                      {user.name || t('profile:notSet')}
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
                      {t('profile:username')}
                    </label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border">
                      <p className="text-slate-900 dark:text-slate-100">
                        {user.name || t('profile:notSet')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {t('profile:email')}
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
                    {t('profile:emailVerification')}
                  </label>
                  <div className="flex items-center space-x-2">
                    {user.emailVerified ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ {t('profile:verified')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        ⚠ {t('profile:unverified')}
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
                  {t('profile:loginMethods')}
                </CardTitle>
                <CardDescription>
                  {t('profile:loginMethodsDesc')}
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
                                {account.type === 'oauth' ? t('profile:oauthLogin') : t('profile:credentialLogin')}
                                {account.providerAccountId && ` • ID: ${account.providerAccountId}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {t('profile:connected')}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                      {t('profile:noLoginMethods')}
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
                  {t('profile:quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  variant="destructive" 
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('profile:logout')}
                </Button>
              </CardContent>
            </Card>

            {/* 账户安全 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  {t('profile:accountSecurity')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {t('profile:twoFactor')}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('profile:twoFactorDesc')}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {t('profile:notEnabled')}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {t('profile:loginActivity')}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('profile:loginActivityDesc')}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {t('profile:normal')}
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

export function ProfileContent(props: ProfileContentProps) {
  return (
    <I18nProvider>
      <ProfileContentInner {...props} />
    </I18nProvider>
  );
}
