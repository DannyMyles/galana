import Image from "next/image"
import { Clock, Fuel, ShieldCheck } from "@/components/icons"

const FEATURES = [
  { icon: ShieldCheck, label: "Secure, audited transactions" },
  { icon: Clock, label: "Real-time ticket validation" },
  { icon: Fuel, label: "Every station, one platform" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#000037]">
      <Image
        src="/galana-station.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#000037]/90 via-[#0B1785]/45 to-[#000037]/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#000037]/60 via-transparent to-[#000037]/25" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1400px] items-center gap-12 px-6 py-10 lg:grid-cols-2 lg:px-14">
        <section className="hidden text-white lg:block">
          <div className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-xl">
            <Image src="/galana-logo.jpeg" alt="Galana Energies" width={177} height={162} className="h-16 w-auto" priority />
          </div>
          <h1 className="mt-14 text-[56px] leading-[1.02] font-bold tracking-tight uppercase">
            Fuel smarter.
            <br />
            <span className="text-[#F75B8C]">Move further.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-white/85">
            The Galana fuel-ticket platform — funding, redemption, settlement and reconciliation in one place.
          </p>
          <ul className="mt-10 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-white/90">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur">
                  <Icon className="size-5" />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-16 text-xs text-white/55">© {new Date().getFullYear()} Galana Energies · energizing your future</p>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-3xl border border-white/25 bg-white/[0.14] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="mb-6 inline-flex rounded-xl bg-white px-3 py-2 lg:hidden">
              <Image src="/galana-logo.jpeg" alt="Galana Energies" width={177} height={162} className="h-12 w-auto" />
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}
