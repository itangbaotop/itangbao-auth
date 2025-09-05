// src/app/auth/signin/page.tsx
"use client";

import { getSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";
import { useAuthProviders } from "@/contexts/AuthProvidersContext";
import { useAuthConfig } from "@/hooks/useAuthConfig";
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { I18nProvider } from "@/contexts/I18nProvider";

function SignInPageContent() {
  const { t } = useTranslation(['auth', 'common']);
  const { providers, isLoading: providersLoading, error: providersError } = useAuthProviders();
  const { config, isLoading: configLoading } = useAuthConfig();
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();

  const oneTapInitialized = useRef(false);

  // OAuth 参数获取
  const originalClientId = searchParams.get('client_id');
  const originalRedirectUri = searchParams.get('redirect_uri');
  const originalResponseType = searchParams.get('response_type');
  const originalState = searchParams.get('state');
  const originalCodeChallenge = searchParams.get('code_challenge');
  const originalCodeChallengeMethod = searchParams.get('code_challenge_method');

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
    }
  }, [
    authorizeRedirectUrl, originalClientId, originalRedirectUri, originalResponseType,
    originalState, originalCodeChallenge, originalCodeChallengeMethod
  ]);

  const handleSuccessfulLoginRedirect = useCallback(async () => {
    if (!authorizeRedirectUrl) {
      console.error("handleSuccessfulLoginRedirect: authorizeRedirectUrl is null, cannot redirect.");
      toast.error(t('auth:errors.loginFailed'), t('auth:errors.default'));
      router.replace("/profile");
      return;
    }

    const session = await getSession();
    console.log("handleSuccessfulLoginRedirect: After signIn, getSession returned:", session);

    if (session?.user?.role === "admin") {
      console.log("handleSuccessfulLoginRedirect: Redirecting to /admin");
      router.replace("/admin");
    } else if (originalClientId && originalRedirectUri) {
      console.log("handleSuccessfulLoginRedirect: Redirecting to /auth/authorize:", authorizeRedirectUrl.toString());
      router.replace(authorizeRedirectUrl.toString());
    } else {
      console.log("handleSuccessfulLoginRedirect: Redirecting to /profile (default)");
      router.replace("/profile");
    }
  }, [
    router, getSession, originalClientId, originalRedirectUri, authorizeRedirectUrl, toast, t
  ]);

  // 处理错误信息
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMessage = t(`auth:errors.\${error}`, { defaultValue: t('auth:errors.default') });
      toast.error(t('auth:errors.loginFailed'), errorMessage);
      
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, toast, t]);

  const handleOAuthSignIn = async (providerId: string) => {
    console.log("Starting OAuth sign-in with provider:", providerId);
    setLoadingProviderId(providerId);
    try {
      let callbackUrl = authorizeRedirectUrl?.toString();
      if (!callbackUrl && typeof window !== 'undefined') {
        const url = new URL('/api/auth/authorize', window.location.origin);
        if (originalClientId) url.searchParams.set('client_id', originalClientId);
        if (originalRedirectUri) url.searchParams.set('redirect_uri', originalRedirectUri);
        if (originalResponseType) url.searchParams.set('response_type', originalResponseType);
        if (originalState) url.searchParams.set('state', originalState!);
        if (originalCodeChallenge) url.searchParams.set('code_challenge', originalCodeChallenge);
        if (originalCodeChallengeMethod) url.searchParams.set('code_challenge_method', originalCodeChallengeMethod);
        callbackUrl = url.toString();
      }
      if (!callbackUrl) {
        toast.error(t('auth:errors.loginFailed'), t('auth:errors.default'));
        return;
      }
      
      await signIn(providerId, {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.log("登陆失败报错：", error);
      toast.error(t('auth:errors.loginFailed'), t('auth:errors.networkError'));
    } finally {
      setLoadingProviderId(null);
    }
  };

  const handleContinueWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(t('auth:errors.emailRequired'), t('auth:errors.emailEmpty'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('auth:errors.emailInvalid'), t('auth:errors.emailInvalidDesc'));
      return;
    }

    setLoadingProviderId("magic-link-email");
    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(t('auth:success.sendSuccess'), data.message);
        
        const verifyRequestUrl = new URL(`/auth/verify-request`, window.location.origin);
        verifyRequestUrl.searchParams.set('email', encodeURIComponent(email));
        if (originalClientId) verifyRequestUrl.searchParams.set('client_id', originalClientId);
        if (originalRedirectUri) verifyRequestUrl.searchParams.set('redirect_uri', originalRedirectUri);
        if (originalResponseType) verifyRequestUrl.searchParams.set('response_type', originalResponseType);
        if (originalState) verifyRequestUrl.searchParams.set('state', originalState);
        if (originalCodeChallenge) verifyRequestUrl.searchParams.set('code_challenge', originalCodeChallenge);
        if (originalCodeChallengeMethod) verifyRequestUrl.searchParams.set('code_challenge_method', originalCodeChallengeMethod);
        
        window.location.href = verifyRequestUrl.toString();
      } else {
        const errorData = await response.json();
        toast.error(t('auth:errors.sendFailed'), errorData.error);
      }
    } catch (error) {
      toast.error(t('auth:errors.sendFailed'), t('auth:errors.networkError'));
    } finally {
      setLoadingProviderId(null);
    }
  };

  if (!originalClientId || !originalRedirectUri || originalResponseType !== 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t('auth:invalidRequest')}</h1>
          <p className="text-gray-700">{t('auth:invalidRequestDesc')}</p>
          <a href="/" className="mt-4 inline-block text-blue-500 hover:underline">{t('auth:returnHome')}</a>
        </div>
      </div>
    );
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId.toLowerCase()) {
      case "google":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case "github":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  const getProviderButtonStyle = (providerId: string) => {
    switch (providerId.toLowerCase()) {
      case "google":
        return "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300";
      case "github":
        return "bg-gray-900 hover:bg-gray-800 text-white";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  // 显示加载状态
  if (providersLoading || configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  // 如果出现错误，显示错误信息
  if (providersError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{providersError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {t('common:retry')}
          </button>
        </div>
      </div>
    );
  }

  // 获取可用的第三方登录提供商
  const oauthProviders = providers ? Object.values(providers).filter(provider => provider.type === "oauth" || provider.type === "oidc") : [];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* 语言切换器 */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="max-w-md w-full space-y-8">
          {/* Logo和标题 */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth:title')}
            </h2>
            <p className="text-gray-600">
              {t('auth:subtitle')}
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
            {/* Google One Tap 加载状态提示 */}
            {loadingProviderId === "google-one-tap" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Google One Tap {t('auth:success.redirecting')}</span>
              </div>
            )}

            {/* 第三方登录按钮 */}
            {oauthProviders.length > 0 && (
              <div className="space-y-3 mb-8">
                {oauthProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleOAuthSignIn(provider.id)}
                    disabled={loadingProviderId !== null}
                    className={`
                      w-full flex justify-center items-center px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                      ${getProviderButtonStyle(provider.id)}
                      shadow-sm hover:shadow-md
                    `}
                  >
                    {loadingProviderId === provider.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    ) : (
                      <>
                        {getProviderIcon(provider.id)}
                        <span className="ml-3">{t('auth:signInWith', { provider: provider.name })}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 分割线 */}
            {oauthProviders.length > 0 && config?.enableMagicLink && (
              <div className="mb-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">{t('auth:or')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 邮箱输入和继续按钮 */}
            {config?.enableMagicLink && (
              <form onSubmit={handleContinueWithEmail} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth:emailAddress')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                    placeholder={t('auth:emailPlaceholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingProviderId !== null}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loadingProviderId === "magic-link-email" ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      <span>{t('auth:sending')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>{t('auth:continueWithEmail')}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 如果没有任何登录方式可用 */}
            {oauthProviders.length === 0 && !config?.enableMagicLink && (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-gray-500">{t('auth:noAuthMethods')}</p>
                <p className="text-xs text-gray-400 mt-2">{t('auth:contactAdmin')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 通知容器 */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}

export default function SignInPage() {
  return (
    <I18nProvider>
      <SignInPageContent />
    </I18nProvider>
  );
}
