import { listPortalUsers } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

/** Portal users are Frappe users with Galana roles. */
export async function getUsers() {
  return toPlain(await listPortalUsers())
}

export type UserListRow = Awaited<ReturnType<typeof getUsers>>[number]
