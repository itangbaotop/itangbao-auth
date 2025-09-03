// src/components/ToastContainer.tsx
"use client";

import { Toast, ToastProps } from "./Toast";

interface ToastContainerProps {
  toasts: ToastProps[];
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ top: `${index * 80}px` }}
          className="relative"
        >
          <Toast {...toast} onClose={onRemoveToast} />
        </div>
      ))}
    </div>
  );
}
