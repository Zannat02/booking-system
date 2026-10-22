import { catchAsync } from "../../utils/catchAsync";
import * as bookingsService from "./bookings.service";
import { ListBookingsQuery } from "./bookings.validation";

export const create = catchAsync(async (req, res) => {
  const booking = await bookingsService.createBooking(req.user!.id, req.body);
  res
    .status(201)
    .json({ success: true, message: "Booking created", data: booking });
});

export const list = catchAsync(async (req, res) => {
  const { data, meta } = await bookingsService.listBookings(
    req.user!,
    res.locals.query as ListBookingsQuery
  );
  res.status(200).json({ success: true, data, meta });
});

export const getOne = catchAsync(async (req, res) => {
  const booking = await bookingsService.getBookingById(
    req.user!,
    req.params.id as string
  );
  res.status(200).json({ success: true, data: booking });
});

export const updateStatus = catchAsync(async (req, res) => {
  const booking = await bookingsService.updateBookingStatus(
    req.user!,
    req.params.id as string,
    req.body
  );
  res
    .status(200)
    .json({ success: true, message: "Booking status updated", data: booking });
});

export const cancel = catchAsync(async (req, res) => {
  const { booking, creditRestored, refunded } =
    await bookingsService.cancelBooking(req.user!, req.params.id as string);

  const notes: string[] = [];
  if (creditRestored) notes.push("your credit has been restored");
  if (refunded) notes.push("your payment has been refunded");

  res.status(200).json({
    success: true,
    message:
      notes.length > 0
        ? `Booking cancelled and ${notes.join(" and ")}`
        : "Booking cancelled",
    data: { booking, creditRestored, refunded },
  });
});