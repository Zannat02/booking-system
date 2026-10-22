import { generateTransactionId } from "./transactionId";


export const mockPaymentGateway = (options: { simulateFailure?: boolean } = {}) => {
  if (options.simulateFailure) {
    return { success: false as const };
  }
  return { success: true as const, transactionId: generateTransactionId() };
};