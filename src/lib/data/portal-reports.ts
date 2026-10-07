import { getPortalCustomer, getPortalDashboard, getPortalReport, listPortalCustomers } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export const customersFor = (actor: string) => listPortalCustomers(actor).then(toPlain)
export const customerFor = (actor: string, name: string) => getPortalCustomer(actor, name).then(toPlain)
export const dashboardFor = (actor: string, days?: number) => getPortalDashboard(actor, days).then(toPlain)
export const reportFor = (actor: string, from: string, to: string) => getPortalReport(actor, from, to).then(toPlain)
