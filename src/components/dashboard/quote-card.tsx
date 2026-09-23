import { Quote } from "@/components/icons"
import type { DailyQuote } from "@/lib/data/quote"

export function QuoteCard({ quote }: { quote: DailyQuote }) {
  return (
    <figure
      title={`${quote.quote} — ${quote.author}`}
      className="flex min-w-0 flex-1 items-center gap-3.5 px-5 py-3.5"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1226AA] to-[#5B6BE0] text-white shadow-sm">
        <Quote className="size-[18px]" />
      </div>
      <div className="min-w-0">
        <blockquote className="line-clamp-2 text-[13px] leading-snug font-medium text-[#0B0B33]">
          {quote.quote}
        </blockquote>
        <figcaption className="mt-1 truncate text-xs text-[#8B8EAA]">— {quote.author}</figcaption>
      </div>
    </figure>
  )
}
