import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123", 10);

  // Users
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      name: "Staff User",
      email: "staff@example.com",
      password: passwordHash,
      role: Role.STAFF,
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "Customer User",
      email: "customer@example.com",
      password: passwordHash,
      role: Role.CUSTOMER,
    },
  });

  // Category
  const category = await prisma.serviceCategory.upsert({
    where: { name: "Home Services" },
    update: {},
    create: { name: "Home Services", description: "Services for your home" },
  });

  // Services
  const serviceData = [
    { name: "AC Servicing", price: 1500, durationMinutes: 120 },
    { name: "Deep Cleaning", price: 2500, durationMinutes: 180 },
    { name: "Plumbing", price: 800, durationMinutes: 60 },
  ];

  const services = [];
  for (const s of serviceData) {
    const service = await prisma.service.upsert({
      where: { categoryId_name: { categoryId: category.id, name: s.name } },
      update: {},
      create: { ...s, categoryId: category.id },
    });
    services.push(service);
  }

  // Plan (AC Servicing + Deep Cleaning only; Plumbing is intentionally NOT included)
  const plan = await prisma.plan.upsert({
    where: { name: "Premium Plan" },
    update: {},
    create: {
      name: "Premium Plan",
      description: "10 service credits for 30 days",
      price: 3000,
      durationDays: 30,
      credits: 10,
    },
  });

  await prisma.planService.createMany({
    data: services.slice(0, 2).map((s) => ({
      planId: plan.id,
      serviceId: s.id,
    })),
    skipDuplicates: true,
  });


  const slotCount = await prisma.slot.count();
  if (slotCount === 0) {
    const staff = await prisma.user.findUniqueOrThrow({
      where: { email: "staff@example.com" },
    });

    const DAY = 24 * 60 * 60 * 1000;
    // Bangladesh time-e (UTC+6) "aj + daysFromNow" er "hour" tar Date
    const at = (daysFromNow: number, hour: number) => {
      const dhaka = new Date(Date.now() + daysFromNow * DAY + 6 * 60 * 60 * 1000);
      const dateStr = dhaka.toISOString().slice(0, 10);
      return new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00+06:00`);
    };

    const slotData = [];
    for (let day = 1; day <= 7; day++) {
      slotData.push({
        serviceId: services[0].id, // AC Servicing
        staffId: staff.id,
        startTime: at(day, 10),
        endTime: at(day, 12),
        capacity: 3,
      });
      slotData.push({
        serviceId: services[1].id, // Deep Cleaning
        staffId: staff.id,
        startTime: at(day, 14),
        endTime: at(day, 17),
        capacity: 2,
      });
      slotData.push({
        serviceId: services[2].id, // Plumbing 
        staffId: staff.id,
        startTime: at(day, 18),
        endTime: at(day, 19),
        capacity: 1,
      });
    }
    await prisma.slot.createMany({ data: slotData });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });