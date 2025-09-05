// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvidersProvider } from "@/contexts/AuthProvidersContext";
import { I18nProvider } from "@/contexts/I18nProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SessionProvider>
        <AuthProvidersProvider>
          {children}
        </AuthProvidersProvider>
      </SessionProvider>
    </I18nProvider>
  );
}
