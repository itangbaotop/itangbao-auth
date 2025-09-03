// src/hooks/useAuthConfig.ts
"use client";

import { useEffect, useState } from "react";

interface AuthConfig {
  enableMagicLink: boolean;
  enableGoogleLogin: boolean;
  enableGithubLogin: boolean;
}

export function useAuthConfig() {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/auth/config");
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        } else {
          setError("获取配置失败");
        }
      } catch (err) {
        setError("获取配置失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, isLoading, error };
}
