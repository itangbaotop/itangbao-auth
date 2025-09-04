// src/app/auth/verify-request/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyRequestPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const appId = searchParams.get('appId');
  const redirectUri = searchParams.get('redirectUri');

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 成功图标 */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            邮件已发送
          </h2>
          <p className="text-gray-600">
            我们已向您发送了魔法链接
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          <div className="text-center space-y-4">
            {/* 邮箱显示 */}
            {email && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">发送至：</span>
                  <br />
                  <span className="font-mono">{email}</span>
                </p>
              </div>
            )}

            {/* 说明 */}
            <div className="space-y-3 text-left">
              <h3 className="font-semibold text-gray-900 text-center">接下来该怎么做？</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      检查您的邮箱（包括垃圾邮件文件夹）
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      点击邮件中的"安全登录"按钮
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      您将自动登录到您的账户
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">重要提示</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• 魔法链接将在 24 小时后过期</li>
                    <li>• 每个链接只能使用一次</li>
                    <li>• 请勿将链接分享给他人</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 返回按钮 */}
            <div className="pt-4">
              <a
                // 返回登录页面时，带上 appId 和 redirectUri
                href={`/auth/signin?appId=${encodeURIComponent(appId || '')}&redirectUri=${encodeURIComponent(redirectUri || '')}`}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                ← 返回登录页面
              </a>
            </div>
          </div>
        </div>

        {/* 底部帮助 */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            没有收到邮件？请检查垃圾邮件文件夹，或{" "}
            <a href="/auth/signin" className="text-blue-600 hover:text-blue-500">
              重新发送
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
