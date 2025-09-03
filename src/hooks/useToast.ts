// src/hooks/useToast.ts
"use client";

import { useState, useCallback } from "react";
import { ToastProps } from "@/components/Toast";

export interface ToastOptions {
  type?: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastProps = {
      id,
      type: options.type || "info",
      title: options.title,
      message: options.message,
      duration: options.duration || 5000,
      onClose: () => removeToast(id),
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: "success", title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: "error", title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: "info", title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: "warning", title, message, duration }),
  };

  return {
    toasts,
    toast,
    removeToast,
  };
}
