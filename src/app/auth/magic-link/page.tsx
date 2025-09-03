// src/app/auth/magic-link/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";

export default function MagicLinkPage() {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const { toasts, toast, removeToast } = useToast();

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
          
          // 使用 NextAuth 登录
          const result = await signIn("credentials", {
            email: email,
            magicToken: token,
            redirect: false,
          });

          if (result?.ok) {
            window.location.href = "/";
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
      setError("验证失败，请重试");
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
