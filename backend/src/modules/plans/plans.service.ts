import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination, buildMeta } from "../../utils/pagination";
import {
  CreatePlanInput,
  UpdatePlanInput,
  ListPlansQuery,
} from "./plans.validation";

// Plan-er shathe tar service gulo-o ene dey
export const planInclude = {
  services: {
    include: {
      service: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
          isActive: true,
        },
      },
    },
  },
} satisfies Prisma.PlanInclude;

// plan.services[].service ke plan.services[] banay (response sundor korar jonno)
export const formatPlan = <T extends { services: { service: unknown }[] }>(
  plan: T
) => ({
  ...plan,
  services: plan.services.map((item) => item.service),
});

const findDuplicateName = (name: string, excludeId?: string) =>
  prisma.plan.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

const validateServiceIds = async (ids: string[]) => {
  const uniqueIds = [...new Set(ids)];
  const found = await prisma.service.findMany({
    where: { id: { in: uniqueIds }, isActive: true },
    select: { id: true },
  });
  if (found.length !== uniqueIds.length) {
    throw new AppError("One or more services do not exist or are inactive", 400);
  }
  return uniqueIds;
};

export const createPlan = async (input: CreatePlanInput) => {
  const { serviceIds, ...planData } = input;

  if (await findDuplicateName(planData.name)) {
    throw new AppError("A plan with this name already exists", 409);
  }

  const uniqueIds = await validateServiceIds(serviceIds);

  const plan = await prisma.plan.create({
    data: {
      ...planData,
      services: { create: uniqueIds.map((serviceId) => ({ serviceId })) },
    },
    include: planInclude,
  });

  return formatPlan(plan);
};

export const listPlans = async (query: ListPlansQuery, role: Role) => {
  const where: Prisma.PlanWhereInput = {};

  if (role === Role.CUSTOMER) {
    where.isActive = true;
  } else if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.plan.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: planInclude,
    }),
    prisma.plan.count({ where }),
  ]);

  return {
    data: data.map(formatPlan),
    meta: buildMeta(query.page, query.limit, total),
  };
};

export const getPlanById = async (id: string, role: Role) => {
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: planInclude,
  });

  if (!plan || (role === Role.CUSTOMER && !plan.isActive)) {
    throw new AppError("Plan not found", 404);
  }
  return formatPlan(plan);
};

export const updatePlan = async (id: string, input: UpdatePlanInput) => {
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Plan not found", 404);
  }

  const { serviceIds, ...planData } = input;

  if (planData.name && (await findDuplicateName(planData.name, id))) {
    throw new AppError("A plan with this name already exists", 409);
  }

  const uniqueIds = serviceIds ? await validateServiceIds(serviceIds) : undefined;

  const plan = await prisma.$transaction(async (tx) => {
    if (uniqueIds) {
    
      await tx.planService.deleteMany({ where: { planId: id } });
      await tx.planService.createMany({
        data: uniqueIds.map((serviceId) => ({ planId: id, serviceId })),
      });
    }
    return tx.plan.update({
      where: { id },
      data: planData,
      include: planInclude,
    });
  });

  return formatPlan(plan);
};