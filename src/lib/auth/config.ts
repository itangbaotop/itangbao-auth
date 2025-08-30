import NextAuth from "next-auth";
import { NextAuthResult } from "next-auth";
import { D1Adapter } from "@auth/d1-adapter";
import { getDB } from "@/lib/db";

const authResult = async (): Promise<NextAuthResult> => {
  return NextAuth({
    providers: [
      
    ],
    adapter: D1Adapter(getDB()),
  });
};

export const { handlers, signIn, signOut, auth } = await authResult();