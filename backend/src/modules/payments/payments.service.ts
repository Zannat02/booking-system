import {
  ActivityAction,
  BookingStatus,
  BookingType,
  PaymentStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination, buildMeta } from "../../utils/pagination";
import { logActivity } from "../../utils/activityLogger";
import { mockPaymentGateway } from "../../utils/paymentGateway";
import { PayBookingInput, ListPaymentsQuery } from "./payments.validation";

type Actor = { id: string; role: Role };

 export  const paymentInclude = {
  user: { select: { id: true, name: true, email: true } },
  booking: {
    select: {
      id: true,
      status: true,
      service: { select: { id: true, name: true } },
    },
  },
  subscription: {
    select: { id: true, plan: { select: { id: true, name: true } } },
  },
} satisfies Prisma.PaymentInclude;

export const payForBooking = async (
  customerId: string,
  input: PayBookingInput
) => {
  const paymentId = await prisma.$transaction(
    async (tx) => {
      
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${input.bookingId} FOR UPDATE`;

  
      const booking = await tx.booking.findFirst({
        where: { id: input.bookingId, customerId },
        include: {
          service: { select: { name: true } },
          payment: true,
        },
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }
      if (booking.type !== BookingType.ONE_TIME) {
        throw new AppError(
          "Subscription bookings are paid with credits, no payment needed",
          400
        );
      }
      if (
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.COMPLETED
      ) {
        throw new AppError(
          `Cannot pay for a ${booking.status.toLowerCase()} booking`,
          409
        );
      }
      if (booking.payment?.status === PaymentStatus.PAID) {
        throw new AppError("This booking is already paid", 409);
      }
      if (booking.payment?.status === PaymentStatus.REFUNDED) {
        throw new AppError("This payment has already been refunded", 409);
      }

  
      const amount = booking.price;
      const gateway = mockPaymentGateway({
        simulateFailure: input.simulateFailure,
      });

      const data = gateway.success
        ? {
            status: PaymentStatus.PAID,
            transactionId: gateway.transactionId,
            paidAt: new Date(),
          }
        : {
            status: PaymentStatus.FAILED,
            transactionId: null,
            paidAt: null,
          };

    
      const payment = booking.payment
        ? await tx.payment.update({
            where: { id: booking.payment.id },
            data: { amount, ...data },
          })
        : await tx.payment.create({
            data: {
              userId: customerId,
              bookingId: booking.id,
              amount,
              ...data,
            },
          });

      if (gateway.success) {
        await logActivity(
          {
            userId: customerId,
            action: ActivityAction.PAYMENT_COMPLETED,
            message: `Payment of ${amount} BDT completed for ${booking.service.name}`,
            metadata: {
              paymentId: payment.id,
              bookingId: booking.id,
              amount,
            },
          },
          tx
        );
      }

      return payment.id;
    },
    { maxWait: 10000, timeout: 20000 }
  );

  return prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: paymentInclude,
  });
};

export const listPayments = async (actor: Actor, query: ListPaymentsQuery) => {
  const where: Prisma.PaymentWhereInput = {};

  if (actor.role === Role.CUSTOMER) {
    where.userId = actor.id;
  } else if (query.userId) {
    where.userId = query.userId;
  }
  if (query.status) {
    where.status = query.status;
  }

  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: paymentInclude,
    }),
    prisma.payment.count({ where }),
  ]);

  return { data, meta: buildMeta(query.page, query.limit, total) };
};

export const getPaymentById = async (actor: Actor, id: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      ...(actor.role === Role.CUSTOMER ? { userId: actor.id } : {}),
    },
    include: paymentInclude,
  });
  if (!payment) {
    throw new AppError("Payment not found", 404);
  }
  return payment;
};