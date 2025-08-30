import { getDB } from "@/lib/db";
import { up } from "@auth/d1-adapter";

export async function GET() {
    try {
        await up(getDB())
    } catch (e: unknown) {
        if (e instanceof Error) {
            const causeMessage = e.cause instanceof Error ? e.cause.message : String(e.cause);
            console.log(causeMessage, e.message)
        }
    }
    return new Response('Migration completed');
}