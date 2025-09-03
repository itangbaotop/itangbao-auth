// src/app/api/auth/config/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
    console.log("ENABLE_MAGIC_LINK", process.env.ENABLE_MAGIC_LINK);
  const config = {
    enableMagicLink: process.env.ENABLE_MAGIC_LINK !== "false",
    enableGoogleLogin: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    enableGithubLogin: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  };

  return NextResponse.json(config);
}
