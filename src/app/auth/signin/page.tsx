// src/app/auth/signin/page.tsx
"use client";

import { getSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";
import { useAuthProviders } from "@/contexts/AuthProvidersContext";
import { useAuthConfig } from "@/hooks/useAuthConfig";
import router from "next/router";


// 声明 Google 的全局类型，避免 TypeScript 报错
declare global {
  namespace google {
    namespace accounts {
      namespace id {
        function initialize(options: {
          client_id: string;
          callback: (response: { credential?: string; select_by?: string; }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          prompt_parent_id?: string;
          itp_support?: boolean;
          ux_mode?: string;
        }): void;
        function renderButton(
          parent: HTMLElement | null,
          options: {
            type?: string;
            size?: string;
            text?: string;
            shape?: string;
            theme?: string;
            locale?: string;
            width?: string;
            logo_alignment?: string;
            click_listener?: () => void;
          }
        ): void;
        function prompt(callback?: (notification: any) => void): void;
      }
    }
  }
}



export default function SignInPage() {
  const { providers, isLoading: providersLoading, error: providersError } = useAuthProviders();
  const { config, isLoading: configLoading } = useAuthConfig();
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();
  const { toasts, toast, removeToast } = useToast();

  const oneTapInitialized = useRef(false);

  // Google One Tap 的初始化和回调
  useEffect(() => {
    console.log("One Tap useEffect: Checking conditions...");
    console.log("configLoading:", configLoading, "config?.enableGoogleLogin:", config?.enableGoogleLogin, "typeof google:", typeof google);
    console.log("oneTapInitialized.current:", oneTapInitialized.current);

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID 未定义，无法初始化 Google One Tap。");
      return;
    }

    if (!configLoading && config?.enableGoogleLogin && typeof google !== 'undefined' && !oneTapInitialized.current) {
      console.log("Initializing Google One Tap with Client ID:", googleClientId);

      try {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            console.log("Google One Tap Callback received:", response);
            if (response.credential) {
              setLoadingProviderId("google-one-tap");
              toast.info("Google One Tap 凭据已接收", "正在处理登录...");
              try {
                // !!! 关键修改 !!!
                // 调用新的自定义 Credentials Provider
                const result = await signIn('google-one-tap-credentials', { // 使用自定义 Provider 的 ID
                  id_token: response.credential, // 传递 ID Token
                  redirect: false, // 禁用 NextAuth 默认重定向
                });

                console.log("Auth.js signIn result for One Tap:", result);

                if (result?.error) {
                  toast.error("Google One Tap 登录失败", result.error);
                } else if (result?.ok) {
                  toast.success("Google One Tap 登录成功", "正在跳转...");
                  const session = await getSession();
                  if (session?.user?.role === "admin") {
                    router.push("/admin");
                  } else {
                    router.push("/profile");
                  }
                }
              } catch (error) {
                console.error("处理 Google One Tap 凭据时发生错误:", error);
                toast.error("Google One Tap 登录失败", "处理凭据时出现错误");
              } finally {
                setLoadingProviderId(null);
              }
            } else {
              console.warn("Google One Tap Callback: 未收到凭据。");
            }
          },
          auto_select: true,
          cancel_on_tap_outside: false,
          itp_support: true,
        });

        console.log("Calling google.accounts.id.prompt()...");
        google.accounts.id.prompt((notification: any) => {
          console.log("Google One Tap Prompt Notification:", notification);
          if (notification.is === "skipped" || notification.is === "dismissed") {
            console.log("Google One Tap 提示被跳过或关闭。原因：", notification.reason || "用户操作");
          } else if (notification.is === "suppressed") {
            console.log("Google One Tap 提示被抑制。原因：", notification.reason);
            if (notification.reason === "credential_returned_from_session_storage") {
              toast.info("Google One Tap 自动登录", "正在尝试自动登录，请稍候...");
            } else if (notification.reason === "auto_select_disabled_by_cooldown") {
              toast.info("Google One Tap 冷却中", "Google One Tap 提示在 10 分钟内不会再次出现。");
            } else if (notification.reason === "fedcm_disabled_by_user" || notification.reason === "browser_fedcm_disabled") {
                toast.error("Google One Tap 禁用", "浏览器 FedCM 被禁用，请在浏览器设置中启用第三方登录。");
            } else {
              toast.info("Google One Tap 提示被抑制", `原因: ${notification.reason}`);
            }
          } else if (notification.is === "success") {
            console.log("Google One Tap 提示成功显示。");
          }
        });
        oneTapInitialized.current = true;
      } catch (e) {
        console.error("Google One Tap 初始化失败:", e);
        toast.error("Google One Tap 初始化失败", "请检查控制台错误。");
      }
    }
    return () => {
      if (typeof google !== 'undefined' && oneTapInitialized.current) {
        console.log("Canceling Google One Tap prompt on component unmount.");
        google.accounts.id.cancel();
        oneTapInitialized.current = false;
      }
    };
  }, [configLoading, config?.enableGoogleLogin, providers, toast, router]);


  // 处理错误信息
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "登录失败";
      switch (error) {
        case "EmailSignin":
          errorMessage = "发送邮件失败，请重试";
          break;
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
        case "EmailCreateAccount":
          errorMessage = "第三方登录失败，请重试";
          break;
        case "Callback":
          errorMessage = "登录回调失败";
          break;
        case "OAuthAccountNotLinked":
          errorMessage = "该邮箱已被其他登录方式使用";
          break;
        case "Verification":
          errorMessage = "验证链接无效或已过期";
          break;
        default:
          errorMessage = "登录过程中出现错误";
      }
      toast.error("登录失败", errorMessage);
      
      // 清除 URL 中的错误参数
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, toast]);

  const handleOAuthSignIn = async (providerId: string) => {
    setLoadingProviderId(providerId); // 设置当前点击的按钮为加载状态
    try {
      await signIn(providerId, { callbackUrl: "/" });
    } catch (error) {
      toast.error("登录失败", "第三方登录出现错误，请重试");
    } finally {
      setLoadingProviderId(null); // 无论成功失败，重置加载状态
    }
  };

  const handleContinueWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("请输入邮箱", "邮箱地址不能为空");
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("邮箱格式错误", "请输入有效的邮箱地址");
      return;
    }

    setIsLoading(true);

    setLoadingProviderId("magic-link-email"); 
    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("发送成功", data.message);
        // 跳转到验证页面
        window.location.href = `/auth/verify-request?email=${encodeURIComponent(email)}`;
      } else {
        const errorData = await response.json();
        toast.error("发送失败", errorData.error);
      }
    } catch (error) {
      toast.error("发送失败", "网络错误，请重试");
    } finally {
      setIsLoading(false);
      setLoadingProviderId(null); 
    }
  };

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
          <p className="text-gray-600">加载中...</p>
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
            重新加载
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
        <div className="max-w-md w-full space-y-8">
          {/* Logo和标题 */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              欢迎使用
            </h2>
            <p className="text-gray-600">
              安全便捷的登录体验，新用户将自动创建账户
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">

            {/* Google One Tap 加载状态提示 */}
            {loadingProviderId === "google-one-tap" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Google One Tap 登录中...</span>
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
                        <span className="ml-3">使用 {provider.name} 登录</span>
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
                    <span className="px-4 bg-white text-gray-500">或</span>
                  </div>
                </div>
              </div>
            )}

            {/* 邮箱输入和继续按钮 */}
            {config?.enableMagicLink && (
              <form onSubmit={handleContinueWithEmail} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
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
                    placeholder="输入您的邮箱地址"
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
                      <span>发送中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>继续</span>
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
                <p className="text-gray-500">暂无可用的登录方式</p>
                <p className="text-xs text-gray-400 mt-2">请联系管理员配置登录方式</p>
              </div>
            )}
          </div>

          {/* 底部信息
          <div className="text-center">
            <p className="text-xs text-gray-500">
              点击继续即表示您同意我们的{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                服务条款
              </a>{" "}
              和{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                隐私政策
              </a>
            </p>
          </div> */}
        </div>
      </div>

      {/* 通知容器 */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
