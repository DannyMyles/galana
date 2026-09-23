import { Quote } from "@/components/icons"
import type { DailyQuote } from "@/lib/data/quote"

export function QuoteCard({ quote }: { quote: DailyQuote }) {
  return (
    <figure title={`${quote.quote} — ${quote.author}`} className="group relative flex w-full max-w-[360px] items-center gap-3 overflow-hidden rounded-2xl bg-white/80 py-2.5 pr-4 pl-3 shadow-[0_2px_12px_rgba(18,38,170,0.07)] ring-1 ring-[#E6E8F3] backdrop-blur transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(18,38,170,0.12)]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1226AA] to-[#5B6BE0] text-white shadow-sm">
        <Quote className="size-4" />
      </div>
      <div className="min-w-0">
        <blockquote className="line-clamp-2 text-xs leading-snug font-medium text-[#0B0B33]">
          {quote.quote}
        </blockquote>
        <figcaption className="mt-0.5 truncate text-[11px] text-[#8B8EAA]">{quote.author}</figcaption>
      </div>
    </figure>
  )
}
