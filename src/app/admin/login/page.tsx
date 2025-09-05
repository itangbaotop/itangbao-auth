// src/app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { signIn, getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toasts, toast, removeToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("admin-credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false, // 禁用 NextAuth 默认重定向
      });

      console.log("Admin login result:", result);

      if (result?.error) {
        toast.error("登录失败", "邮箱或密码错误，或您不是管理员");
      } else if (result?.ok) {
        const session = await getSession();
        if (session?.user?.role === "admin") {
          toast.success("登录成功", "欢迎回来，管理员！");
          router.push("/admin"); // 手动跳转
        } else {
          toast.error("权限不足", "您不是管理员用户");
          // 登录成功但不是管理员，也需要退出会话
          await signOut({ callbackUrl: "/auth/signin" });
        }
      }
    } catch (error) {
      toast.error("登录失败", "登录过程中出现错误");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo和标题 */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-red-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              管理员登录
            </h2>
            <p className="text-gray-300">
              请使用管理员账户登录
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg py-8 px-6 shadow-2xl rounded-2xl border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  管理员邮箱
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-300"
                  placeholder="输入管理员邮箱"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-300"
                  placeholder="输入密码"
                />
              </div>

              {/* 安全提示 */}
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-amber-200 text-xs font-medium">管理员专用入口</p>
                    <p className="text-amber-100 text-xs mt-1">
                      此入口仅供系统管理员使用，普通用户请使用主登录页面
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>管理员登录</span>
                  </>
                )}
              </button>
            </form>

            {/* 返回主页链接 */}
            <div className="mt-6 text-center">
              <a
                href="/auth/signin"
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>返回普通用户登录</span>
              </a>
            </div>
          </div>

          {/* 底部帮助 */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              忘记管理员密码请联系系统超级管理员
            </p>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
