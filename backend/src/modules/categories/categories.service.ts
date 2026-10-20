import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination, buildMeta } from "../../utils/pagination";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
} from "./categories.validation";

const findDuplicateName = (name: string, excludeId?: string) =>
  prisma.serviceCategory.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

export const createCategory = async (input: CreateCategoryInput) => {
  if (await findDuplicateName(input.name)) {
    throw new AppError("A category with this name already exists", 409);
  }
  return prisma.serviceCategory.create({ data: input });
};

export const listCategories = async (query: ListCategoriesQuery, role: Role) => {
  const where: Prisma.ServiceCategoryWhereInput = {};

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
    prisma.serviceCategory.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { services: true } } },
    }),
    prisma.serviceCategory.count({ where }),
  ]);

  return { data, meta: buildMeta(query.page, query.limit, total) };
};

export const getCategoryById = async (id: string, role: Role) => {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  });

  if (!category || (role === Role.CUSTOMER && !category.isActive)) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

export const updateCategory = async (id: string, input: UpdateCategoryInput) => {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Category not found", 404);
  }

  if (input.name && (await findDuplicateName(input.name, id))) {
    throw new AppError("A category with this name already exists", 409);
  }

  return prisma.serviceCategory.update({ where: { id }, data: input });
};