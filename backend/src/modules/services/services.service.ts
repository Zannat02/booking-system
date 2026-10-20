import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination, buildMeta } from "../../utils/pagination";
import {
  CreateServiceInput,
  UpdateServiceInput,
  ListServicesQuery,
} from "./services.validation";

const categorySelect = { select: { id: true, name: true, isActive: true } };

const ensureCategoryExists = async (categoryId: string) => {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
};

const findDuplicate = (categoryId: string, name: string, excludeId?: string) =>
  prisma.service.findFirst({
    where: {
      categoryId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

export const createService = async (input: CreateServiceInput) => {
  await ensureCategoryExists(input.categoryId);

  if (await findDuplicate(input.categoryId, input.name)) {
    throw new AppError("This service already exists in the category", 409);
  }

  return prisma.service.create({
    data: input,
    include: { category: categorySelect },
  });
};

export const listServices = async (query: ListServicesQuery, role: Role) => {
  const where: Prisma.ServiceWhereInput = {};

  if (role === Role.CUSTOMER) {
  
    where.isActive = true;
    where.category = { isActive: true };
  } else if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = { gte: query.minPrice, lte: query.maxPrice };
  }

  const orderBy: Prisma.ServiceOrderByWithRelationInput =
    query.sortBy === "price"
      ? { price: query.order }
      : query.sortBy === "name"
        ? { name: query.order }
        : { createdAt: query.order };

  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { category: categorySelect },
    }),
    prisma.service.count({ where }),
  ]);

  return { data, meta: buildMeta(query.page, query.limit, total) };
};

export const getServiceById = async (id: string, role: Role) => {
  const service = await prisma.service.findUnique({
    where: { id },
    include: { category: categorySelect },
  });

  const hiddenFromCustomer =
    role === Role.CUSTOMER &&
    service &&
    (!service.isActive || !service.category.isActive);

  if (!service || hiddenFromCustomer) {
    throw new AppError("Service not found", 404);
  }
  return service;
};

export const updateService = async (id: string, input: UpdateServiceInput) => {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Service not found", 404);
  }

  if (input.categoryId && input.categoryId !== existing.categoryId) {
    await ensureCategoryExists(input.categoryId);
  }

  if (input.name || input.categoryId) {
    const newName = input.name ?? existing.name;
    const newCategoryId = input.categoryId ?? existing.categoryId;
    if (await findDuplicate(newCategoryId, newName, id)) {
      throw new AppError("This service already exists in the category", 409);
    }
  }

  return prisma.service.update({
    where: { id },
    data: input,
    include: { category: categorySelect },
  });
};