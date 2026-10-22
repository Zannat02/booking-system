import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { getPagination, buildMeta } from "../../utils/pagination";
import { ListActivityQuery } from "./activity.validation";

type Actor = { id: string; role: Role };

const activityInclude = {
  user: { select: { id: true, name: true, role: true } },
} satisfies Prisma.ActivityLogInclude;

const scopeFor = (actor: Actor): Prisma.ActivityLogWhereInput =>
  actor.role === Role.ADMIN ? {} : { userId: actor.id };


export const getLatestActivities = (actor: Actor, limit = 10) =>
  prisma.activityLog.findMany({
    where: scopeFor(actor),
    orderBy: { createdAt: "desc" },
    take: limit,
    include: activityInclude,
  });

export const listActivities = async (actor: Actor, query: ListActivityQuery) => {
  const conditions: Prisma.ActivityLogWhereInput[] = [scopeFor(actor)];

  if (query.action) {
    conditions.push({ action: query.action });
  }

  if (actor.role === Role.ADMIN && query.userId) {
    conditions.push({ userId: query.userId });
  }

  const where: Prisma.ActivityLogWhereInput = { AND: conditions };
  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: activityInclude,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { data, meta: buildMeta(query.page, query.limit, total) };
};