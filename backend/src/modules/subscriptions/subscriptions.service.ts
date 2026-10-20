import {
  ActivityAction,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";
import { prisma, type DbClient } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination, buildMeta } from "../../utils/pagination";
import { logActivity } from "../../utils/activityLogger";
import { generateTransactionId } from "../../utils/transactionId";
import { planInclude, formatPlan } from "../plans/plans.service";
import {
  MySubscriptionsQuery,
  AllSubscriptionsQuery,
} from "./subscriptions.validation";

const subscriptionInclude = {
  plan: { include: planInclude },
} satisfies Prisma.SubscriptionInclude;

const formatSubscription = <
  T extends { plan: { services: { service: unknown }[] } }
>(
  subscription: T
) => ({
  ...subscription,
  plan: formatPlan(subscription.plan),
});

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

// endDate por hoye gese emn ACTIVE subscription ke EXPIRED kore
export const expireOutdatedSubscriptions = (client: DbClient, userId?: string) =>
  client.subscription.updateMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      endDate: { lt: new Date() },
      ...(userId ? { userId } : {}),
    },
    data: { status: SubscriptionStatus.EXPIRED },
  });

export const subscribeToPlan = async (userId: string, planId: string) => {
  return prisma.$transaction(async (tx) => {
    // Ei customer-er row lock: duto request ek shathe ashle dwitiyo ta opekkha korbe
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

    await expireOutdatedSubscriptions(tx, userId);

    const plan = await tx.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new AppError("Plan not found or not available", 404);
    }

    const activeSubscription = await tx.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gt: new Date() },
      },
    });
    if (activeSubscription) {
      throw new AppError("You already have an active subscription", 409);
    }

    const startDate = new Date();
    const endDate = addDays(startDate, plan.durationDays);

    const subscription = await tx.subscription.create({
      data: {
        userId,
        planId: plan.id,
        startDate,
        endDate,
        remainingCredits: plan.credits,
      },
      include: subscriptionInclude,
    });

    // Mock payment: shathe shathe PAID
    const payment = await tx.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: plan.price,
        status: PaymentStatus.PAID,
        transactionId: generateTransactionId(),
        paidAt: new Date(),
      },
    });

    await logActivity(
      {
        userId,
        action: ActivityAction.SUBSCRIPTION_CREATED,
        message: `Subscribed to ${plan.name}`,
        metadata: { subscriptionId: subscription.id, planId: plan.id },
      },
      tx
    );
    await logActivity(
      {
        userId,
        action: ActivityAction.PAYMENT_COMPLETED,
        message: `Payment of ${plan.price} BDT completed for ${plan.name}`,
        metadata: { paymentId: payment.id, amount: plan.price },
      },
      tx
    );

    return { subscription: formatSubscription(subscription), payment };
  });
};

export const listMySubscriptions = async (
  userId: string,
  query: MySubscriptionsQuery
) => {
  await expireOutdatedSubscriptions(prisma, userId);

  const where: Prisma.SubscriptionWhereInput = { userId };
  if (query.status) {
    where.status = query.status;
  }

  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { startDate: "desc" },
      include: subscriptionInclude,
    }),
    prisma.subscription.count({ where }),
  ]);

  return {
    data: data.map(formatSubscription),
    meta: buildMeta(query.page, query.limit, total),
  };
};

export const getMyActiveSubscription = async (userId: string) => {
  await expireOutdatedSubscriptions(prisma, userId);

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      endDate: { gt: new Date() },
    },
    include: subscriptionInclude,
  });

  return subscription ? formatSubscription(subscription) : null;
};

export const listAllSubscriptions = async (query: AllSubscriptionsQuery) => {
  await expireOutdatedSubscriptions(prisma);

  const where: Prisma.SubscriptionWhereInput = {};
  if (query.status) {
    where.status = query.status;
  }
  if (query.userId) {
    where.userId = query.userId;
  }

  const { skip, take } = getPagination(query.page, query.limit);

  const [data, total] = await prisma.$transaction([
    prisma.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true } },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  return { data, meta: buildMeta(query.page, query.limit, total) };
};