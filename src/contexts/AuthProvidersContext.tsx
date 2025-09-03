// src/contexts/AuthProvidersContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getProviders } from "next-auth/react";

interface Provider {
  id: string;
  name: string;
  type: string;
}

interface AuthProvidersContextType {
  providers: Record<string, Provider> | null;
  isLoading: boolean;
  error: string | null;
}

const AuthProvidersContext = createContext<AuthProvidersContextType | undefined>(undefined);

export function AuthProvidersProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProviders = async () => {
      try {
        console.log("开始获取 providers...");
        
        // 等待一下确保 SessionProvider 完全初始化
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const res = await getProviders();
        console.log("获取到的 providers:", res);
        
        if (mounted) {
          setProviders(res);
          setIsLoading(false);
          console.log("providers 设置成功");
        }
      } catch (err) {
        console.error("获取 providers 失败:", err);
        if (mounted) {
          setError("获取登录提供商失败");
          setIsLoading(false);
        }
      }
    };

    fetchProviders();

    return () => {
      mounted = false;
    };
  }, []);

  const value = {
    providers,
    isLoading,
    error,
  };

  console.log("AuthProvidersContext value:", value);

  return (
    <AuthProvidersContext.Provider value={value}>
      {children}
    </AuthProvidersContext.Provider>
  );
}

export function useAuthProviders() {
  const context = useContext(AuthProvidersContext);
  if (context === undefined) {
    throw new Error("useAuthProviders must be used within AuthProvidersProvider");
  }
  return context;
}
