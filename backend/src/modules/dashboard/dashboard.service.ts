import {
  BookingStatus,
  PaymentStatus,
  Role,
  SubscriptionStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { getTodayRange } from "../../utils/dateRange";
import { getLatestActivities } from "../activity/activity.service";
import { bookingInclude } from "../bookings/bookings.service";
import { paymentInclude } from "../payments/payments.service";
import { getMyActiveSubscription } from "../subscriptions/subscriptions.service";

type Actor = { id: string; role: Role };

const getAdminDashboard = async (actor: Actor) => {
  const { start, end } = getTodayRange();

 
  const [
    totalCustomers,
    activeSubscriptions,
    todaysBookings,
    revenue,
    statusGroups,
    recentActivities,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { gt: new Date() },
      },
    }),
    prisma.booking.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: start, lt: end },
      },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    getLatestActivities(actor, 10),
  ]);

  const counts = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const group of statusGroups) {
    counts[group.status] = group._count._all;
  }

  return {
    stats: {
      totalCustomers,
      activeSubscriptions,
      todaysBookings,
      todaysRevenue: revenue._sum.amount ?? 0,
      completedBookings: counts.COMPLETED,
      cancelledBookings: counts.CANCELLED,
      pendingBookings: counts.PENDING,
      confirmedBookings: counts.CONFIRMED,
    },
    recentActivities,
  };
};

const getStaffDashboard = async (actor: Actor) => {
  const { start, end } = getTodayRange();
  const now = new Date();

  const todayWhere = {
    status: { not: BookingStatus.CANCELLED },
    slot: { staffId: actor.id, startTime: { gte: start, lt: end } },
  };
  const upcomingWhere = {
    status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    slot: { staffId: actor.id, startTime: { gte: now } },
  };
  const completedWhere = {
    status: BookingStatus.COMPLETED,
    slot: { staffId: actor.id },
  };

  const [
    todaysItems,
    upcomingItems,
    upcomingCount,
    completedItems,
    completedCount,
    recentActivities,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: todayWhere,
      orderBy: { slot: { startTime: "asc" } },
      include: bookingInclude,
    }),
    prisma.booking.findMany({
      where: upcomingWhere,
      orderBy: { slot: { startTime: "asc" } },
      take: 10,
      include: bookingInclude,
    }),
    prisma.booking.count({ where: upcomingWhere }),
    prisma.booking.findMany({
      where: completedWhere,
      orderBy: { completedAt: "desc" },
      take: 10,
      include: bookingInclude,
    }),
    prisma.booking.count({ where: completedWhere }),
    getLatestActivities(actor, 10),
  ]);

  return {
    todaysAssignedBookings: { count: todaysItems.length, items: todaysItems },
    upcomingServices: { count: upcomingCount, items: upcomingItems },
    completedServices: { count: completedCount, items: completedItems },
    recentActivities,
  };
};

const getCustomerDashboard = async (actor: Actor) => {
  const [currentSubscription, upcomingBookings, paymentHistory, recentActivities] =
    await Promise.all([
      getMyActiveSubscription(actor.id),
      prisma.booking.findMany({
        where: {
          customerId: actor.id,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          slot: { startTime: { gte: new Date() } },
        },
        orderBy: { slot: { startTime: "asc" } },
        take: 10,
        include: bookingInclude,
      }),
      prisma.payment.findMany({
        where: { userId: actor.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: paymentInclude,
      }),
      getLatestActivities(actor, 10),
    ]);

  return {
    currentSubscription,
    remainingCredits: currentSubscription?.remainingCredits ?? 0,
    upcomingBookings,
    paymentHistory,
    recentActivities,
  };
};

export const getDashboard = async (actor: Actor) => {
  if (actor.role === Role.ADMIN) {
    return { role: actor.role, ...(await getAdminDashboard(actor)) };
  }
  if (actor.role === Role.STAFF) {
    return { role: actor.role, ...(await getStaffDashboard(actor)) };
  }
  return { role: actor.role, ...(await getCustomerDashboard(actor)) };
};