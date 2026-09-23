import type { Metadata } from "next"
import { Poppins, Comfortaa } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Galana Portal",
  description: "Fuel Ticket Management & Fulfilment Portal",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${comfortaa.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  )
}
