import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getDB() {
  return (await getCloudflareContext({async: true})).env.DB
}