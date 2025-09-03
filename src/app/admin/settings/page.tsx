// src/app/admin/settings/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    siteName: "itangbao-auth",
    allowRegistration: true,
    requireEmailVerification: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 这里可以调用保存设置的 API
      // const response = await fetch("/api/admin/settings", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(settings),
      // });

      // 模拟保存
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("设置已保存", "系统设置已成功更新");
    } catch (error) {
      toast.error("保存失败", "无法保存系统设置");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600 mt-2">配置系统的基本设置和安全选项</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSaveSettings}>
            <div className="p-6 space-y-6">
              {/* 基本设置 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">基本设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      站点名称
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      会话超时时间 (小时)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 安全设置 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">安全设置</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">允许用户注册</label>
                      <p className="text-xs text-gray-500">允许新用户通过第三方登录自动注册</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowRegistration}
                        onChange={(e) => setSettings(prev => ({ ...prev, allowRegistration: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">要求邮箱验证</label>
                      <p className="text-xs text-gray-500">新用户必须验证邮箱才能使用服务</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireEmailVerification}
                        onChange={(e) => setSettings(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大登录尝试次数
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                      className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">超过此次数将暂时锁定账户</p>
                  </div>
                </div>
              </div>

              {/* 系统信息 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">系统信息</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">系统版本:</span>
                    <span className="font-medium">v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Node.js 版本:</span>
                    <span className="font-medium">v18.17.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">数据库:</span>
                    <span className="font-medium">Cloudflare D1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">运行环境:</span>
                    <span className="font-medium">Edge Runtime</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                重置
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isLoading ? "保存中..." : "保存设置"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
