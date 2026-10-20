import { ActivityAction } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { logActivity } from "../../utils/activityLogger";
import { RegisterInput, LoginInput } from "./auth.validation";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
};

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const hashed = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: hashed,
    },
    select: publicUserSelect,
  });

  await logActivity({
    userId: user.id,
    action: ActivityAction.USER_REGISTERED,
    message: `${user.name} registered as a new customer`,
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user, token };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  const passwordOk = user
    ? await comparePassword(input.password, user.password)
    : false;

  if (!user || !passwordOk) {
    throw new AppError("Invalid email or password", 401);
  }
  if (!user.isActive) {
    throw new AppError("Your account is deactivated", 403);
  }

  const token = signToken({ userId: user.id, role: user.role });
  const { password: _password, ...safeUser } = user;
  return { user: safeUser, token };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};