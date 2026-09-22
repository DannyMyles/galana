import { Prisma } from "@prisma/client"

/**
 * Recursively converts Prisma `Decimal` instances to plain numbers.
 *
 * Next.js Server Components serialize their props into an RSC payload when
 * rendering a Client Component, and only plain objects/arrays/primitives
 * (plus a few built-ins like Date) survive that trip — a Decimal class
 * instance does not, and silently renders as "" client-side while logging
 * "Only plain objects can be passed to Client Components" to the console.
 * Call this on any row set fetched with Prisma before handing it to a
 * "use client" table/component.
 */
export function toPlain<T>(value: T): T {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber() as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => toPlain(item)) as unknown as T
  }
  if (value instanceof Date) {
    return value
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = toPlain(val)
    }
    return result as T
  }
  return value
}
