// src/app/page.tsx
import { auth } from "@/lib/auth/config";
import { HomePage } from "@/components/HomePage";

export default async function Home() {
  const session = await auth();
  
  return <HomePage session={session} />;
}
