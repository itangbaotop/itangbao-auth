// src/app/admin/layout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    // 如果当前是管理员登录页面，不进行任何客户端重定向，直接渲染子组件
    if (pathname === "/admin/login") {
      return;
    }

    // 对于其他 /admin 路由，如果用户未登录或不是管理员，
    // 中间件会处理重定向到 /admin/login，所以这里不需要客户端重定向
    // 我们可以简单地检查状态并决定是否渲染布局内容
  }, [status, pathname]); // 依赖中移除 session 和 router，因为中间件处理了重定向

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果当前是管理员登录页面，直接渲染子组件，无论会话状态如何
  if (pathname === "/admin/login") {
      return <>{children}</>;
  }

  // 如果不是管理员且不在登录页，则不渲染任何内容
  // 因为中间件已经将请求重定向到 /admin/login 了
  if (!session || session.user?.role !== "admin") {
      return null;
  }

  // 否则，渲染带有导航栏的布局
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 左侧 Logo 和导航 */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">itangbao-auth</span>
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">管理后台</span>
              </div>
              
              {/* 导航菜单 */}
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                <a
                  href="/admin"
                  className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  应用管理
                </a>
                <a
                  href="/admin/oauth-configs"
                  className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  OAuth 配置
                </a>
                <a
                  href="/admin/users"
                  className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  用户管理
                </a>
              </div>
            </div>

            {/* 右侧用户菜单 */}
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-2 hover:bg-gray-50 transition-colors duration-200"
                >
                  {/* 用户头像 */}
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    {session.user?.image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt={session.user.name || "管理员"}
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "A"}
                      </span>
                    )}
                  </div>
                  
                  {/* 用户名和角色 */}
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {session.user?.name || "管理员"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.user?.email}
                    </div>
                  </div>
                  
                  {/* 下拉箭头 */}
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 下拉菜单 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                        <div className="font-medium text-gray-900">{session.user?.name || "管理员"}</div>
                        <div className="text-xs">{session.user?.email}</div>
                      </div>
                      
                      <a
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>个人资料</span>
                      </a>
                      
                      <a
                        href="/admin/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>系统设置</span>
                      </a>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 点击外部关闭菜单 */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
}
