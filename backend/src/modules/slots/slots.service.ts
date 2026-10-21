import { Prisma, Role } from "@prisma/client";
import { prisma, type DbClient } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination, buildMeta } from "../../utils/pagination";
import { getDayRange } from "../../utils/dateRange";
import {
  CreateSlotInput,
  UpdateSlotInput,
  ListSlotsQuery,
} from "./slots.validation";

type Actor = { id: string; role: Role };

const slotInclude = {
  service: {
    select: { id: true, name: true, price: true, durationMinutes: true },
  },
  staff: { select: { id: true, name: true } },
} satisfies Prisma.SlotInclude;

const formatSlot = <T extends { capacity: number; bookedCount: number }>(
  slot: T
) => ({
  ...slot,
  remainingSeats: slot.capacity - slot.bookedCount,
});

const ensureAssignableStaff = async (client: DbClient, staffId: string) => {
  const staff = await client.user.findUnique({
    where: { id: staffId },
    select: { role: true, isActive: true },
  });
  if (!staff || !staff.isActive || staff.role === Role.CUSTOMER) {
    throw new AppError("Invalid staff member", 400);
  }
};


const assertNoOverlap = async (
  client: DbClient,
  staffId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string
) => {
  const clash = await client.slot.findFirst({
    where: {
      staffId,
      isActive: true,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (clash) {
    throw new AppError(
      "This staff member already has a slot in that time range",
      409
    );
  }
};

export const createSlot = async (actor: Actor, input: CreateSlotInput) => {
  if (input.startTime <= new Date()) {
    throw new AppError("Slot start time must be in the future", 400);
  }

  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
    include: { category: { select: { isActive: true } } },
  });
  if (!service) {
    throw new AppError("Service not found", 404);
  }
  if (!service.isActive || !service.category.isActive) {
    throw new AppError("Cannot create slots for an inactive service", 400);
  }


  let staffId = actor.id;
  if (input.staffId && input.staffId !== actor.id) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Staff can only create slots for themselves", 403);
    }
    staffId = input.staffId;
  }

  await ensureAssignableStaff(prisma, staffId);
  await assertNoOverlap(prisma, staffId, input.startTime, input.endTime);

  const slot = await prisma.slot.create({
    data: {
      serviceId: input.serviceId,
      staffId,
      startTime: input.startTime,
      endTime: input.endTime,
      capacity: input.capacity,
    },
    include: slotInclude,
  });

  return formatSlot(slot);
};

export const listSlots = async (query: ListSlotsQuery, role: Role) => {
  const isCustomer = role === Role.CUSTOMER;
  const conditions: Prisma.SlotWhereInput[] = [];

  if (isCustomer) {

    conditions.push({
      isActive: true,
      service: { isActive: true, category: { isActive: true } },
    });
  } else if (query.isActive !== undefined) {
    conditions.push({ isActive: query.isActive });
  }


  if (isCustomer || query.available === true) {
    conditions.push({
      isActive: true,
      startTime: { gt: new Date() },
      bookedCount: { lt: prisma.slot.fields.capacity },
    });
  }

  if (query.serviceId) {
    conditions.push({ serviceId: query.serviceId });
  }
  if (query.staffId) {
    conditions.push({ staffId: query.staffId });
  }
  if (query.date) {
    const { start, end } = getDayRange(query.date);
    conditions.push({ startTime: { gte: start, lt: end } });
  }

  const where: Prisma.SlotWhereInput = { AND: conditions };
  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.slot.findMany({
      where,
      skip,
      take,
      orderBy: { startTime: query.order },
      include: slotInclude,
    }),
    prisma.slot.count({ where }),
  ]);

  return {
    data: data.map(formatSlot),
    meta: buildMeta(query.page, query.limit, total),
  };
};

export const getSlotById = async (id: string, role: Role) => {
  const slot = await prisma.slot.findFirst({
    where: {
      id,
      ...(role === Role.CUSTOMER
        ? {
            isActive: true,
            service: { isActive: true, category: { isActive: true } },
          }
        : {}),
    },
    include: slotInclude,
  });

  if (!slot) {
    throw new AppError("Slot not found", 404);
  }
  return formatSlot(slot);
};

export const updateSlot = async (
  actor: Actor,
  id: string,
  input: UpdateSlotInput
) => {
  const slot = await prisma.$transaction(async (tx) => {
  
    await tx.$queryRaw`SELECT id FROM "Slot" WHERE id = ${id} FOR UPDATE`;

    const existing = await tx.slot.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Slot not found", 404);
    }

    if (actor.role === Role.STAFF && existing.staffId !== actor.id) {
      throw new AppError("You can only modify your own slots", 403);
    }
    if (input.staffId !== undefined && actor.role !== Role.ADMIN) {
      throw new AppError("Only an admin can reassign a slot", 403);
    }

    const startTime = input.startTime ?? existing.startTime;
    const endTime = input.endTime ?? existing.endTime;
    const timeChanged =
      input.startTime !== undefined || input.endTime !== undefined;

    if (timeChanged) {
      if (endTime <= startTime) {
        throw new AppError("endTime must be after startTime", 400);
      }
      if (input.startTime && input.startTime <= new Date()) {
        throw new AppError("Slot start time must be in the future", 400);
      }
      if (existing.bookedCount > 0) {
        throw new AppError(
          "Cannot change the time of a slot that already has bookings",
          409
        );
      }
    }

    if (input.capacity !== undefined && input.capacity < existing.bookedCount) {
      throw new AppError(
        `Capacity cannot be lower than the ${existing.bookedCount} seat(s) already booked`,
        409
      );
    }

    if (input.staffId !== undefined) {
      await ensureAssignableStaff(tx, input.staffId);
    }

    const staffId = input.staffId ?? existing.staffId;
    const willBeActive = input.isActive ?? existing.isActive;
    const needsOverlapCheck =
      timeChanged || input.staffId !== undefined || input.isActive === true;

    if (willBeActive && needsOverlapCheck) {
      await assertNoOverlap(tx, staffId, startTime, endTime, id);
    }

    return tx.slot.update({
      where: { id },
      data: input,
      include: slotInclude,
    });
  });

  return formatSlot(slot);
};