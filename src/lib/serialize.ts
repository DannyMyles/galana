/**
 * Pass-through for values read from the Frappe services. They are already plain
 * JSON-style objects, so nothing needs converting. Kept so the data layer's call sites stay the same.
 */
export function toPlain<T>(value: T): T {
  return value
}
