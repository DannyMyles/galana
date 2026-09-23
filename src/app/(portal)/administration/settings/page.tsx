import { PageHeader } from "@/components/shared/page-header"
import { AdministrationSubNav } from "@/components/administration/administration-subnav"
import { SettingsForm } from "@/components/administration/settings-form"
import { getSettings } from "@/lib/settings"
import { requirePermission } from "@/lib/rbac/guard"

export default async function SettingsPage() {
  await requirePermission("settings:manage")
  const settings = await getSettings()
  return (
    <div>
      <PageHeader title="Settings" description="Business rules that drive limits, discounts and reconciliation. Every change is audited with old and new values." />
      <AdministrationSubNav />
      <SettingsForm initial={settings} />
    </div>
  )
}
