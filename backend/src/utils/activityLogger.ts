import { ActivityAction, Prisma } from "@prisma/client";
import { prisma, type DbClient } from "../config/prisma";

interface LogInput {
  userId?: string;
  action: ActivityAction;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

export const logActivity = async (
  data: LogInput,
  client: DbClient = prisma
) => {
  await client.activityLog.create({ data });
};