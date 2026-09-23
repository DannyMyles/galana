import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../src/lib/auth/password"
import { ROLES } from "../src/lib/rbac/roles"
import { seedExtras } from "./seed-extra"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEMO_OTP = "123456"

async function main() {
  console.log("Seeding roles…")
  for (const roleName of ROLES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    })
  }

  const defaultPassword = await hashPassword("Password123!")

  async function createUser(
    name: string,
    email: string,
    roleName: (typeof ROLES)[number],
    stationId?: string
  ) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } })
    return prisma.user.upsert({
      where: { email },
      update: { stationId },
      create: {
        name,
        email,
        passwordHash: defaultPassword,
        status: "ACTIVE",
        stationId,
        roles: { create: [{ roleId: role.id }] },
      },
    })
  }

  console.log("Seeding fuel products…")
  const [pms, ago] = await Promise.all([
    prisma.fuelProduct.upsert({
      where: { code: "PMS" },
      update: {},
      create: { code: "PMS", name: "Petrol (PMS)" },
    }),
    prisma.fuelProduct.upsert({
      where: { code: "AGO" },
      update: {},
      create: { code: "AGO", name: "Diesel (AGO)" },
    }),
  ])

  console.log("Seeding dealer + station…")
  const dealer = await prisma.dealer.create({
    data: { name: "Galana Westlands Dealer Ltd", contactPhone: "+254700000000" },
  })

  const station = await prisma.station.create({
    data: {
      name: "Galana Westlands",
      code: "SW001",
      region: "Nairobi",
      county: "Nairobi",
      status: "ACTIVE",
      dealerId: dealer.id,
      products: {
        create: [{ productId: pms.id }, { productId: ago.id }],
      },
    },
  })

  await prisma.pOSDevice.create({
    data: { deviceId: "SW-POS-008", stationId: station.id, softwareVersion: "GTK-V2.4" },
  })

  await prisma.epraPrice.createMany({
    data: [
      { productId: pms.id, pricePerLitre: 195.5, effectiveFrom: new Date() },
      { productId: ago.id, pricePerLitre: 180.5, effectiveFrom: new Date() },
    ],
  })

  console.log("Seeding users (password for all: Password123!)…")
  await createUser("John Doe", "admin@galana.co.ke", "SYSTEM_ADMIN")
  await createUser("Jane Wanjiku", "finance.maker@galana.co.ke", "FINANCE_MAKER")
  await createUser("Peter Otieno", "finance.checker@galana.co.ke", "FINANCE_CHECKER")
  await createUser("Mary Achieng", "ops@galana.co.ke", "OPS_FUEL_CARD")
  await createUser("John M.", "station.manager@galana.co.ke", "STATION_DEALER_MANAGER", station.id)
  await createUser("Grace Njeri", "auditor@galana.co.ke", "INTERNAL_AUDITOR")

  console.log("Seeding Jaguar customer, wallet, vehicle…")
  const customer = await prisma.customer.create({
    data: {
      name: "Jaguar Petroleum",
      tier: "Tier-1 Fleet Corporate",
      wallet: { create: { balance: 12_450_000 } },
      vehicles: { create: [{ regNo: "KDJ 123A" }, { regNo: "KDA 456B" }] },
    },
    include: { wallet: true, vehicles: true },
  })

  console.log("Seeding a historical redeemed ticket + completed transaction…")
  const historicalTicket = await prisma.ticket.create({
    data: {
      ticketNo: "GTK-001200",
      customerId: customer.id,
      vehicleId: customer.vehicles[1].id,
      productId: ago.id,
      authorisedQuantityL: 50,
      remainingQuantityL: 0,
      status: "REDEEMED",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  const historicalTransaction = await prisma.transaction.create({
    data: {
      reference: "TXN-001200",
      ticketId: historicalTicket.id,
      stationId: station.id,
      status: "COMPLETED",
      authorisedQtyL: 50,
      dispensedQtyL: 50,
      unitTariff: 180.5,
      totalAmount: 9025,
      completedAt: new Date(),
    },
  })

  await prisma.dealerSettlement.create({
    data: {
      transactionId: historicalTransaction.id,
      stationId: station.id,
      grossAmount: 9025,
      netPayableToDealer: 9025,
    },
  })

  console.log(`Seeding a live-redeemable ticket (demo OTP: ${DEMO_OTP})…`)
  await prisma.ticket.create({
    data: {
      ticketNo: "GTK-001234",
      customerId: customer.id,
      vehicleId: customer.vehicles[0].id,
      productId: ago.id,
      authorisedQuantityL: 50,
      remainingQuantityL: 50,
      status: "ISSUED",
      otpHash: await hashPassword(DEMO_OTP),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  await seedExtras(prisma)

  console.log("\nDone.")
  console.log("-----------------------------------------------------")
  console.log("Login as any seeded user with password: Password123!")
  console.log("  admin@galana.co.ke, finance.maker@galana.co.ke,")
  console.log("  finance.checker@galana.co.ke, ops@galana.co.ke,")
  console.log("  station.manager@galana.co.ke, auditor@galana.co.ke")
  console.log(`Validate ticket GTK-001234 at /validate-ticket with OTP: ${DEMO_OTP} or QR code: QR-GTK-001234`)
  console.log("-----------------------------------------------------")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
