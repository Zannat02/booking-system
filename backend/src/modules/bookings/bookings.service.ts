import {
  ActivityAction,
  BookingStatus,
  BookingType,
  Prisma,
  Role,
  SubscriptionStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination, buildMeta } from "../../utils/pagination";
import { getDayRange } from "../../utils/dateRange";
import { logActivity } from "../../utils/activityLogger";
import { expireOutdatedSubscriptions } from "../subscriptions/subscriptions.service";
import { CreateBookingInput, ListBookingsQuery } from "./bookings.validation";

type Actor = { id: string; role: Role };

export const bookingInclude = {
  customer: { select: { id: true, name: true, email: true } },
  service: { select: { id: true, name: true } },
  slot: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      staff: { select: { id: true, name: true } },
    },
  },
  subscription: {
    select: { id: true, remainingCredits: true, endDate: true },
  },
  payment: {
    select: { id: true, status: true, amount: true, paidAt: true },
  },
} satisfies Prisma.BookingInclude;


export const accessFilter = (actor: Actor): Prisma.BookingWhereInput => {
  if (actor.role === Role.CUSTOMER) return { customerId: actor.id };
  if (actor.role === Role.STAFF) return { slot: { staffId: actor.id } };
  return {}; 
};

export const createBooking = async (
  customerId: string,
  input: CreateBookingInput
) => {
  const bookingId = await prisma.$transaction(
    async (tx) => {
     
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${customerId} FOR UPDATE`;

     
      const slot = await tx.slot.findUnique({
        where: { id: input.slotId },
        include: {
          service: { include: { category: { select: { isActive: true } } } },
        },
      });
      if (!slot) {
        throw new AppError("Slot not found", 404);
      }
      if (!slot.service.isActive || !slot.service.category.isActive) {
        throw new AppError("This service is currently inactive", 400);
      }
      if (!slot.isActive) {
        throw new AppError("This slot is not available", 400);
      }
      if (slot.startTime <= new Date()) {
        throw new AppError("This slot has already started", 400);
      }
      if (slot.bookedCount >= slot.capacity) {
        throw new AppError("This slot is full", 409);
      }

      // 3) Duplicate booking 
      const duplicate = await tx.booking.findFirst({
        where: {
          customerId,
          slotId: slot.id,
          status: { not: BookingStatus.CANCELLED },
        },
      });
      if (duplicate) {
        throw new AppError("You already have a booking for this slot", 409);
      }

     
      let subscriptionId: string | null = null;
      let price = slot.service.price;

      if (input.type === BookingType.SUBSCRIPTION) {
        await expireOutdatedSubscriptions(tx, customerId);

        const subscription = await tx.subscription.findFirst({
          where: { userId: customerId, status: SubscriptionStatus.ACTIVE },
          orderBy: { startDate: "desc" },
        });

        if (!subscription) {
          const last = await tx.subscription.findFirst({
            where: { userId: customerId },
            orderBy: { endDate: "desc" },
          });
          throw new AppError(
            last?.status === SubscriptionStatus.EXPIRED
              ? "Your subscription has expired"
              : "You do not have an active subscription",
            403
          );
        }

        const allowed = await tx.planService.findUnique({
          where: {
            planId_serviceId: {
              planId: subscription.planId,
              serviceId: slot.serviceId,
            },
          },
        });
        if (!allowed) {
          throw new AppError("This service is not included in your plan", 403);
        }

        if (subscription.remainingCredits < 1) {
          throw new AppError("You have no service credits left", 409);
        }

        subscriptionId = subscription.id;
        price = 0;
      }

     
      const seat = await tx.slot.updateMany({
        where: {
          id: slot.id,
          isActive: true,
          bookedCount: { lt: prisma.slot.fields.capacity },
        },
        data: { bookedCount: { increment: 1 } },
      });
      if (seat.count === 0) {
        throw new AppError("This slot is full", 409);
      }

     
      if (subscriptionId) {
        const credit = await tx.subscription.updateMany({
          where: {
            id: subscriptionId,
            status: SubscriptionStatus.ACTIVE,
            endDate: { gt: new Date() },
            remainingCredits: { gt: 0 },
          },
          data: { remainingCredits: { decrement: 1 } },
        });
        if (credit.count === 0) {
          throw new AppError("You have no service credits left", 409);
        }
      }


      const booking = await tx.booking.create({
        data: {
          customerId,
          serviceId: slot.serviceId,
          slotId: slot.id,
          subscriptionId,
          type: input.type,
          price,
          status: BookingStatus.PENDING,
        },
      });

      await logActivity(
        {
          userId: customerId,
          action: ActivityAction.BOOKING_CREATED,
          message: `Booked ${slot.service.name} (${input.type === BookingType.SUBSCRIPTION ? "subscription" : "one-time"})`,
          metadata: { bookingId: booking.id, slotId: slot.id, type: input.type },
        },
        tx
      );

      return booking.id;
    },
    { maxWait: 10000, timeout: 20000 }
  );

  return prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: bookingInclude,
  });
};

export const listBookings = async (actor: Actor, query: ListBookingsQuery) => {
  const conditions: Prisma.BookingWhereInput[] = [accessFilter(actor)];

  if (actor.role !== Role.CUSTOMER && query.customerId) {
    conditions.push({ customerId: query.customerId });
  }
  if (query.status) conditions.push({ status: query.status });
  if (query.type) conditions.push({ type: query.type });
  if (query.serviceId) conditions.push({ serviceId: query.serviceId });
  if (query.slotId) conditions.push({ slotId: query.slotId });
  if (query.date) {
    const { start, end } = getDayRange(query.date);
    conditions.push({ slot: { startTime: { gte: start, lt: end } } });
  }

  const where: Prisma.BookingWhereInput = { AND: conditions };
  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: bookingInclude,
    }),
    prisma.booking.count({ where }),
  ]);

  return { data, meta: buildMeta(query.page, query.limit, total) };
};

export const getBookingById = async (actor: Actor, id: string) => {
  const booking = await prisma.booking.findFirst({
    where: { AND: [{ id }, accessFilter(actor)] },
    include: bookingInclude,
  });
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  return booking;
};