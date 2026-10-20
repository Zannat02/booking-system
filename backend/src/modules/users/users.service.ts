import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/password";
import { getPagination, buildMeta } from "../../utils/pagination";
import { publicUserSelect } from "./user.select";
import { CreateStaffInput, ListUsersQuery } from "./users.validation";

export const createStaff = async (input: CreateStaffInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: await hashPassword(input.password),
      role: Role.STAFF,
    },
    select: publicUserSelect,
  });
};

export const listUsers = async (query: ListUsersQuery) => {
  const where: Prisma.UserWhereInput = {};

  if (query.role) {
    where.role = query.role;
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: publicUserSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, meta: buildMeta(query.page, query.limit, total) };
};