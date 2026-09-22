import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="inline-flex w-fit rounded-md bg-white px-3 py-2">
          <Image src="/logo-full.png" alt="Galana Energies" width={160} height={52} className="h-8 w-auto" priority />
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Fueling Progress
            <br />
            Together.
          </h1>
          <p className="mt-4 max-w-md text-sidebar-foreground/70">
            Efficient fuel ticket management and seamless fulfilment for our
            valued customers.
          </p>
          <ul className="mt-8 grid grid-cols-3 gap-4 text-sm text-sidebar-foreground/70">
            <li>Secure Transactions</li>
            <li>Real-time Updates</li>
            <li>Better Visibility</li>
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Galana Energies
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
