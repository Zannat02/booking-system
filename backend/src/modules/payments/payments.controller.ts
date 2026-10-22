import { PaymentStatus } from "@prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import * as paymentsService from "./payments.service";
import { ListPaymentsQuery } from "./payments.validation";

export const pay = catchAsync(async (req, res) => {
  const payment = await paymentsService.payForBooking(req.user!.id, req.body);

  if (payment.status === PaymentStatus.FAILED) {
  
    return res.status(402).json({
      success: false,
      message: "Payment failed. You can try again.",
      data: payment,
    });
  }

  res
    .status(201)
    .json({ success: true, message: "Payment successful", data: payment });
});

export const list = catchAsync(async (req, res) => {
  const { data, meta } = await paymentsService.listPayments(
    req.user!,
    res.locals.query as ListPaymentsQuery
  );
  res.status(200).json({ success: true, data, meta });
});

export const getOne = catchAsync(async (req, res) => {
  const payment = await paymentsService.getPaymentById(
    req.user!,
    req.params.id as string
  );
  res.status(200).json({ success: true, data: payment });
});