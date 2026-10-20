import { randomBytes } from "crypto";

export const generateTransactionId = () =>
  `TXN-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;