// src/app/admin/page.tsx (完整版本，包含编辑功能)
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";

interface Application {
  id: string;
  name: string;
  description: string;
  domain: string;
  redirectUris: string;
  clientId: string;
  clientSecret: string;
  isActive: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  totalUsers: number;
  todayLogins: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeApplications: 0,
    totalUsers: 0,
    todayLogins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      redirect("/admin/login");
    }
    fetchApplications();
  }, [session, status]);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/admin/applications");
      if (response.ok) {
        const apps = await response.json();
        setApplications(apps);
        
        // 计算统计数据
        setStats({
          totalApplications: apps.length,
          activeApplications: apps.filter((app: Application) => app.isActive).length,
          totalUsers: 0,
          todayLogins: 0,
        });
      } else {
        const error = await response.json();
        toast.error("获取应用列表失败", error.error);
      }
    } catch (error) {
      console.error("获取应用列表失败:", error);
      toast.error("获取应用列表失败", "网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async (formData: FormData) => {
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      domain: formData.get("domain"),
      redirectUris: formData.get("redirectUris")?.toString().split("\n").filter(Boolean),
    };

    try {
      const response = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowCreateForm(false);
        fetchApplications();
        toast.success("应用创建成功", `应用 "${data.name}" 已成功创建`);
      } else {
        const error = await response.json();
        toast.error("创建应用失败", error.error);
      }
    } catch (error) {
      console.error("创建应用失败:", error);
      toast.error("创建应用失败", "网络错误，请重试");
    }
  };

  const handleUpdateApp = async (formData: FormData) => {
    if (!editingApp) return;

    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      domain: formData.get("domain"),
      redirectUris: formData.get("redirectUris")?.toString().split("\n").filter(Boolean),
      isActive: formData.get("isActive") === "on",
    };

    try {
      const response = await fetch(`/api/admin/applications/${editingApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEditingApp(null);
        fetchApplications();
        toast.success("应用更新成功", `应用 "${data.name}" 已成功更新`);
      } else {
        const error = await response.json();
        toast.error("更新应用失败", error.error);
      }
    } catch (error) {
      console.error("更新应用失败:", error);
      toast.error("更新应用失败", "网络错误，请重试");
    }
  };

  const handleDeleteApp = async (id: string, name: string) => {
    const shouldDelete = window.confirm(`确定要删除应用 "${name}" 吗？此操作不可撤销。`);
    if (!shouldDelete) return;

    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchApplications();
        toast.success("应用删除成功", `应用 "${name}" 已成功删除`);
      } else {
        const error = await response.json();
        toast.error("删除应用失败", error.error);
      }
    } catch (error) {
      console.error("删除应用失败:", error);
      toast.error("删除应用失败", "网络错误，请重试");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            欢迎回来，{session?.user?.name || "管理员"}！
          </h1>
          <p className="text-gray-600 mt-2">
            管理您的应用和用户，监控系统状态
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总应用数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃应用</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeApplications}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日登录</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayLogins}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 应用管理区域 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">应用管理</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>创建新应用</span>
            </button>
          </div>

          <div className="p-6">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无应用</h3>
                <p className="mt-1 text-sm text-gray-500">开始创建您的第一个应用</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {applications.map((app) => (
                  <div key={app.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            app.isActive 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {app.isActive ? "激活" : "禁用"}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{app.description}</p>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p><span className="font-medium">域名:</span> {app.domain}</p>
                          <p><span className="font-medium">Client ID:</span> {app.clientId}</p>
                          <p><span className="font-medium">创建时间:</span> {new Date(app.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingApp(app)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                          title="编辑应用"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteApp(app.id, app.name)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                          title="删除应用"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 创建应用表单 */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">创建新应用</h2>
              <form action={handleCreateApp}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">应用名称</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入应用名称"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">描述</label>
                  <textarea
                    name="description"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="应用描述（可选）"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">域名</label>
                  <input
                    name="domain"
                    type="text"
                    required
                    placeholder="example.com"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    回调地址 (每行一个)
                  </label>
                  <textarea
                    name="redirectUris"
                    required
                    placeholder="https://example.com/callback"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    创建
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 编辑应用表单 */}
        {editingApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">编辑应用</h2>
              <form action={handleUpdateApp}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">应用名称</label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingApp.name}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">描述</label>
                  <textarea
                    name="description"
                    defaultValue={editingApp.description}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">域名</label>
                  <input
                    name="domain"
                    type="text"
                    required
                    defaultValue={editingApp.domain}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    回调地址 (每行一个)
                  </label>
                  <textarea
                    name="redirectUris"
                    required
                    defaultValue={JSON.parse(editingApp.redirectUris).join("\n")}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={editingApp.isActive}
                      className="mr-2"
                    />
                    启用应用
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    更新
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingApp(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
