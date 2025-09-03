// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;  // 改为 role
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { toasts, toast, removeToast } = useToast();

  // 判断是否为管理员
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      redirect("/auth/signin");
    }
    fetchProfile();
  }, [session, status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setFormData(prev => ({
          ...prev,
          name: profileData.name || "",
        }));
      } else {
        const error = await response.json();
        toast.error("获取用户资料失败", error.error);
      }
    } catch (error) {
      toast.error("获取用户资料失败", "网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    // 如果要修改密码，验证密码确认
    if (showPasswordForm) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("密码验证失败", "新密码和确认密码不匹配");
        setSaving(false);
        return;
      }
      
      if (formData.newPassword.length < 6) {
        toast.error("密码长度不足", "新密码长度至少6位");
        setSaving(false);
        return;
      }
    }

    try {
      const updateData: any = {
        name: formData.name,
      };

      if (showPasswordForm && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        toast.success("资料更新成功", "您的个人资料已成功更新");
        
        // 更新session中的用户名
        await update({
          name: updatedProfile.name,
        });
        
        // 重置密码表单
        if (showPasswordForm) {
          setFormData(prev => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
          setShowPasswordForm(false);
        }
      } else {
        const errorData = await response.json();
        toast.error("更新失败", errorData.error);
      }
    } catch (error) {
      toast.error("更新失败", "网络错误，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 获取角色显示名称
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'user':
        return '普通用户';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">加载用户资料失败</p>
        </div>
      </div>
    );
  }

  return (
    <>
        <div className="min-h-screen bg-gray-50">
        {/* 导航栏 */}
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-semibold">个人资料</h1>
                <div className="flex items-center gap-4">
                {isAdmin && (
                    <a
                    href="/admin"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                    管理后台
                    </a>
                )}
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-600 hover:text-red-800 text-sm"
                >
                    退出登录
                </button>
                </div>
            </div>
            </div>
        </nav>

        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                <h2 className="text-xl font-semibold">{profile.name || "未设置姓名"}</h2>
                <p className="text-gray-600">{profile.email}</p>
                {isAdmin && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                    {getRoleDisplayName(profile.role)}
                    </span>
                )}
                </div>
            </div>


            {/* 消息提示 */}
            {message && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {message}
                </div>
            )}
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 基本信息 */}
                <div>
                <h3 className="text-lg font-medium mb-4">基本信息</h3>
                
                <div className="grid gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        姓名
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入姓名"
                    />
                    </div>
                    
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        邮箱
                    </label>
                    <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">邮箱地址不可修改</p>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        角色
                    </label>
                    <input
                        type="text"
                        value={getRoleDisplayName(profile.role)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                    </div>
                </div>
                </div>

                {/* 密码修改部分保持不变... */}
                <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">密码</h3>
                    <button
                    type="button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                    {showPasswordForm ? "取消修改密码" : "修改密码"}
                    </button>
                </div>
                
                {showPasswordForm && (
                    <div className="grid gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        当前密码
                        </label>
                        <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        required={showPasswordForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        新密码
                        </label>
                        <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        required={showPasswordForm}
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        确认新密码
                        </label>
                        <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required={showPasswordForm}
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    </div>
                )}
                </div>

                {/* 账户信息 */}
                <div>
                <h3 className="text-lg font-medium mb-4">账户信息</h3>
                <div className="grid gap-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                    <span>注册时间:</span>
                    <span>{new Date(profile.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                    <span>最后更新:</span>
                    <span>{new Date(profile.updatedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                    <span>用户ID:</span>
                    <span className="font-mono text-xs">{profile.id}</span>
                    </div>
                </div>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "保存中..." : "保存更改"}
                </button>
                </div>
            </form>
            </div>
        </div>
        </div>

        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
