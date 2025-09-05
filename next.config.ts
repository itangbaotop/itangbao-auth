import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
    localeDetection: false, // 禁用自动语言检测，使用我们的自定义检测
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}
