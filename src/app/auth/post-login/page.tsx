// src/app/auth/post-login/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';
import { verifyJwt } from '@/lib/utils/jwt'; // 导入你的 JWT 验证函数

export default function PostLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { toast, toasts, removeToast } = useToast();

  useEffect(() => {
    if (status === 'loading') return; // 等待会话加载

    const appId = searchParams.get('appId') || searchParams.get('client_id');
    const redirectUri = searchParams.get('redirectUri') || searchParams.get('redirect_uri');
    const token = searchParams.get('token'); // Auth.js 可能会将 token 直接放在这里

    // 调试日志
    console.log("--- PostLoginPage useEffect ---");
    console.log("Session status:", status);
    console.log("Session user:", session?.user);
    console.log("AppId param:", appId);
    console.log("RedirectUri param:", redirectUri);
    console.log("Token param:", token);

    // 情况 1: 管理员登录成功，直接跳转到 /admin
    if (session?.user?.role === 'admin') {
      toast.success('管理员登录成功', '正在进入管理后台...');
      router.replace('/admin');
      return;
    }

    // 情况 2: 普通用户登录成功，并且有 appId 和 redirectUri，重定向到客户端应用
    if (session?.user && appId && redirectUri) {
      // 这里的 token 理论上应该由 Auth.js 的 redirect 回调通过 URL 重定向到 clientRedirectUri
      // 但为了健壮性，如果 Auth.js 内部将 token 附加到这个页面，我们也处理
      if (token) {
         try {
            const decodedPayload = verifyJwt(token, appId); // 验证 JWT
            console.log("Token found on post-login page and verified:", decodedPayload);
            // 构造最终的客户端重定向 URL
            const finalClientRedirect = new URL(redirectUri);
            finalClientRedirect.searchParams.set('token', token);
            toast.success('登录成功', '正在跳转到客户端应用...');
            router.replace(finalClientRedirect.toString());
            return;
         } catch (e) {
            console.error("JWT 验证失败 (PostLoginPage):", e);
            toast.error("登录失败", "JWT 验证失败，请重新登录。");
            router.replace(`/auth/signin?appId=${encodeURIComponent(appId)}&redirectUri=${encodeURIComponent(redirectUri)}`);
            return;
         }
      } else {
        // 如果没有 token，但有 appId 和 redirectUri，说明 Auth.js 的 redirect 回调可能出了问题
        // 或者用户直接访问了这个页面
        console.warn("PostLoginPage: Missing token for client app redirect.");
        toast.error("登录失败", "缺少认证凭据，请重新登录。");
        router.replace(`/auth/signin?appId=${encodeURIComponent(appId)}&redirectUri=${encodeURIComponent(redirectUri)}`);
        return;
      }
    }

    // 情况 3: 普通用户登录成功，但没有 appId 或 redirectUri，重定向到认证服务自己的 /profile 页
    if (session?.user && (!appId || !redirectUri)) {
      toast.success('登录成功', '正在进入个人资料页...');
      router.replace('/profile');
      return;
    }

    // 情况 4: 用户未登录，重定向到 /auth/signin
    if (!session?.user && status === 'unauthenticated') {
      toast.info('请登录', '您需要登录才能访问。');
      router.replace('/auth/signin');
      return;
    }

    // 如果所有条件都不满足，可能是加载中或异常情况
  }, [status, session, appId, redirectUri, token, router, toast]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center bg-white py-8 px-6 shadow-xl rounded-2xl">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M3 12H2m15.325-7.325l-.707-.707M6.343 17.657l-.707-.707M16 3.58a8.001 8.001 0 00-4-1.58C7.573 2 4 5.573 4 10s3.573 8 8 8 8-3.573 8-8c0-1.553-.414-3.003-1.096-4.325z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            正在处理登录...
          </h2>
          <p className="text-gray-600">
            请稍候，我们正在为您跳转。
          </p>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
