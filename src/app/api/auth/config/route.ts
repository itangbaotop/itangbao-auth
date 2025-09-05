// src/app/api/auth/config/route.ts
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

export async function GET() {
  const { env } = await getCloudflareContext();
  const config = {
    enableMagicLink: (env.ENABLE_MAGIC_LINK as string | undefined) !== "false",
    enableGoogleLogin: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    enableGithubLogin: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  };

  return NextResponse.json(config);
}
