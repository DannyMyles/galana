import { PageHeader } from "@/components/shared/page-header"
import { AdministrationSubNav } from "@/components/administration/administration-subnav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { KpiCard } from "@/components/shared/kpi-card"
import { Plug, Building2, Cpu, Link2 } from "@/components/icons"
import { INTEGRATION_ENDPOINTS } from "@/lib/integrations/registry"
import { requirePermission } from "@/lib/rbac/guard"
import { prisma } from "@/lib/db/client"

export default async function IntegrationsPage() {
  await requirePermission("integrations:view")
  const [pending, synced, failed, notSynced] = await Promise.all([
    prisma.station.count({ where: { jplSyncStatus: "PENDING" } }),
    prisma.station.count({ where: { jplSyncStatus: "SYNCED" } }),
    prisma.station.count({ where: { jplSyncStatus: "FAILED" } }),
    prisma.station.count({ where: { jplSyncStatus: "NOT_SYNCED" } }),
  ])
  const systems = ["Jaguar", "POS", "JPL OMC"] as const

  return (
    <div>
      <PageHeader title="Integrations" description="Contract inventory for the Jaguar, POS and JPL OMC interfaces. The portal is ready for each endpoint; none is connected yet." />
      <AdministrationSubNav />

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Endpoints defined" value={INTEGRATION_ENDPOINTS.length.toString()} icon={Plug} iconTint="blue" />
        <KpiCard label="Stations awaiting JPL sync" value={pending.toString()} icon={Building2} iconTint="amber" />
        <KpiCard label="Synced / failed" value={`${synced} / ${failed}`} icon={Link2} iconTint="emerald" />
        <KpiCard label="Not yet synced" value={notSynced.toString()} icon={Cpu} iconTint="purple" />
      </div>

      <div className="flex flex-col gap-5">
        {systems.map((system) => (
          <Card key={system}>
            <CardHeader><CardTitle className="text-lg">{system === "POS" ? "POS integration (Galana ⇄ POS devices)" : system === "Jaguar" ? "Jaguar integration" : "JPL OMC onboarding sync"}</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {INTEGRATION_ENDPOINTS.filter((e) => e.system === system).map((e) => (
                    <tr key={e.story + e.path} className="border-t border-[#EEF0F8] first:border-0">
                      <td className="py-3 pr-4 text-xs font-medium whitespace-nowrap text-muted-foreground">{e.story}</td>
                      <td className="py-3 pr-4 font-medium whitespace-nowrap">{e.name}</td>
                      <td className="py-3 pr-4 whitespace-nowrap"><code className="rounded-md bg-[#F1F2FA] px-2 py-0.5 text-xs">{e.method} {e.path}</code></td>
                      <td className="py-3 pr-4 text-muted-foreground">{e.purpose}</td>
                      <td className="py-3 text-right"><StatusBadge status="OFFLINE" className="!bg-slate-100 !text-slate-500" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
