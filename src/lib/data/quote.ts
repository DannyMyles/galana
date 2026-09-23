export interface DailyQuote {
  quote: string
  author: string
  source: "api" | "fallback"
}

// API Ninjas has no fuel/energy category; these are the closest fit for a commercial operations platform.
const CATEGORIES = "business,success,leadership"

const FALLBACK_QUOTES: Omit<DailyQuote, "source">[] = [
  { quote: "People. Products. Profits. In that order.", author: "Ken Goldstein" },
  { quote: "If there's one thing that's certain in business, it's uncertainty.", author: "Stephen Covey" },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
]

function fallback(): DailyQuote {
  const pick = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
  return { ...pick, source: "fallback" }
}

/** Server-only: the API key never reaches the browser. Cached for 30 minutes to stay within API limits. */
export async function getRandomQuote(): Promise<DailyQuote> {
  const apiKey = process.env.RANDOM_QUOTE_API_KEY
  const baseUrl = process.env.RANDOM_QUOTE_API_URL
  if (!apiKey || !baseUrl) return fallback()

  try {
    const response = await fetch(`${baseUrl}?categories=${CATEGORIES}`, {
      headers: { "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 1800 },
    })
    if (!response.ok) return fallback()

    const data = (await response.json()) as { quote?: string; author?: string }[]
    const first = data[0]
    if (!first?.quote) return fallback()

    return { quote: first.quote.trim(), author: (first.author ?? "Unknown").replace(/\s+/g, " ").trim(), source: "api" }
  } catch {
    return fallback()
  }
}
