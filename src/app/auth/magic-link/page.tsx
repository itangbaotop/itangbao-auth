// src/app/auth/magic-link/page.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";

export default function MagicLinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const { toasts, toast, removeToast } = useToast();

  const componentMounted = useRef(true);

  // 从 URL 获取原始 OAuth 参数
  const originalClientId = searchParams.get('client_id');
  const originalRedirectUri = searchParams.get('redirect_uri');
  const originalResponseType = searchParams.get('response_type');
  const originalState = searchParams.get('state');
  const originalCodeChallenge = searchParams.get('code_challenge');
  const originalCodeChallengeMethod = searchParams.get('code_challenge_method');

  // 构建登录成功后重定向到 /auth/authorize 的 URL
  // 确保在客户端环境才访问 window.location.origin
  const [authorizeRedirectUrl, setAuthorizeRedirectUrl] = useState<URL | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !authorizeRedirectUrl) {
      const url = new URL('/api/auth/authorize', window.location.origin);
      if (originalClientId) url.searchParams.set('client_id', originalClientId);
      if (originalRedirectUri) url.searchParams.set('redirect_uri', originalRedirectUri);
      if (originalResponseType) url.searchParams.set('response_type', originalResponseType);
      if (originalState) url.searchParams.set('state', originalState);
      if (originalCodeChallenge) url.searchParams.set('code_challenge', originalCodeChallenge);
      if (originalCodeChallengeMethod) url.searchParams.set('code_challenge_method', originalCodeChallengeMethod);
      setAuthorizeRedirectUrl(url);
      console.log("authorizeRedirectUrl initialized:", url.toString());
    }
  }, [
    authorizeRedirectUrl, originalClientId, originalRedirectUri, originalResponseType, 
    originalState, originalCodeChallenge, originalCodeChallengeMethod
  ]);

  const handleSuccessfulLoginRedirect = useCallback(async () => {
    // 只有当组件仍然挂载时才执行跳转
    if (!componentMounted.current) {
      console.warn("Component unmounted, skipping redirect.");
      return;
    }

    if (!authorizeRedirectUrl) {
      console.error("handleSuccessfulLoginRedirect: authorizeRedirectUrl is null, cannot redirect.");
      toast.error("跳转失败", "认证服务配置错误，请联系管理员。");
      router.replace("/profile"); // 回退到默认页面
      return;
    }

    const session = await getSession(); // 获取最新会话
    console.log("handleSuccessfulLoginRedirect: After signIn, getSession returned:", session);

    if (session?.user?.role === "admin") {
      console.log("handleSuccessfulLoginRedirect: Redirecting to /admin");
      router.replace("/admin");
    } else if (originalClientId && originalRedirectUri) { // 确保有 OAuth 参数
      console.log("handleSuccessfulLoginRedirect: Redirecting to /auth/authorize:", authorizeRedirectUrl.toString());
      router.replace(authorizeRedirectUrl.toString());
    } else {
      console.log("handleSuccessfulLoginRedirect: Redirecting to /profile (default)");
      router.replace("/profile"); // 普通用户默认跳转到个人资料页
    }
  }, [
    router, originalClientId, originalRedirectUri, authorizeRedirectUrl, toast
  ]);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (!token || !email) {
      setError("无效的魔法链接");
      setIsVerifying(false);
      return;
    }

    verifyMagicLink(token, email);
  }, [searchParams]);

  const verifyMagicLink = async (token: string, email: string) => {
    try {
      const response = await fetch("/api/auth/verify-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast.success("验证成功", "正在为您登录...");
          
          const result = await signIn("magic-link-credentials", {
            email: email,
            magicToken: token,
            redirect: false,
          });

          if (result?.ok) {
            setTimeout(() => {
                handleSuccessfulLoginRedirect();
            }, 500);
          } else {
            setError("登录失败，请重试");
          }
        } else {
          setError(data.error || "验证失败");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "验证失败");
      }
    } catch (error) {
      console.error("验证魔法链接失败:", error);
      setError("验证失败", "请重试");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证魔法链接...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-white py-8 px-6 shadow-xl rounded-2xl text-center">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">验证失败</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <a
                href="/auth/signin"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                返回登录页面
              </a>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </>
    );
  }

  return null;
}
