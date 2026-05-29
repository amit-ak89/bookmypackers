import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

function createClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data in dependency order
  await prisma.webhookEvent.deleteMany();
  await prisma.allocationState.deleteMany();
  await prisma.leadAssignment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.service.deleteMany();

  // Create 8 providers
  const providers = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.provider.create({
        data: { name: `Provider ${i + 1}`, monthlyQuota: 10, leadsAssigned: 0 },
      })
    )
  );

  const [p1, p2, p3, p4, p5, p6, p7, p8] = providers;

  // Service 1: Mandatory=P1, Pool=P2,P3,P4
  const service1 = await prisma.service.create({
    data: {
      name: "Service 1",
      providers: { connect: [{ id: p1.id }] },
      poolProviders: { connect: [{ id: p2.id }, { id: p3.id }, { id: p4.id }] },
    },
  });

  // Service 2: Mandatory=P5, Pool=P6,P7,P8
  const service2 = await prisma.service.create({
    data: {
      name: "Service 2",
      providers: { connect: [{ id: p5.id }] },
      poolProviders: { connect: [{ id: p6.id }, { id: p7.id }, { id: p8.id }] },
    },
  });

  // Service 3: Mandatory=P1,P4, Pool=P2,P3,P5,P6,P7,P8
  const service3 = await prisma.service.create({
    data: {
      name: "Service 3",
      providers: { connect: [{ id: p1.id }, { id: p4.id }] },
      poolProviders: {
        connect: [
          { id: p2.id }, { id: p3.id }, { id: p5.id },
          { id: p6.id }, { id: p7.id }, { id: p8.id },
        ],
      },
    },
  });

  // Initialize round-robin allocation state for each service
  await prisma.allocationState.createMany({
    data: [
      { serviceId: service1.id, currentIndex: 0 },
      { serviceId: service2.id, currentIndex: 0 },
      { serviceId: service3.id, currentIndex: 0 },
    ],
  });

  console.log("✅ Seeded 8 providers, 3 services, allocation states initialized");
  console.log(`   Service 1 (id: ${service1.id})`);
  console.log(`   Service 2 (id: ${service2.id})`);
  console.log(`   Service 3 (id: ${service3.id})`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
