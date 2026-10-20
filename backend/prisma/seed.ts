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