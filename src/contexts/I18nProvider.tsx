// src/components/providers/I18nProvider.tsx
"use client";

import { useEffect } from 'react';
import '@/lib/i18n/config';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // 确保 i18n 在客户端初始化
  }, []);

  return <>{children}</>;
}
