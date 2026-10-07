import { PageHeader } from "@/components/shared/page-header"
import { AdministrationSubNav } from "@/components/administration/administration-subnav"
import { SettingsForm } from "@/components/administration/settings-form"
import { getSettings } from "@/lib/settings"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"

export default async function SettingsPage() {
  const user = await requirePermission(["settings:manage", "discounts:manage"])
  const settings = await getSettings()
  const fullAccess = hasPermission(user.roles, "settings:manage")
  return (
    <div>
      <PageHeader title="Settings" description="Business rules that drive limits, discounts and reconciliation. Every change is audited with old and new values." />
      <AdministrationSubNav />
      <SettingsForm initial={settings} fullAccess={fullAccess} />
    </div>
  )
}
