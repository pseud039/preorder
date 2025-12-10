import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { prisma } from "../../lib/prisma.js";
import { OrderService } from "../../utils/order.service.js";
import bcrypt from "bcrypt";

// const updateDetails = asyncHandler(async (req, res) => {
//   const userId = req.userId;
//   const { name, phone } = req.body;
//   if (!userId) {
//     throw new ApiError(401, "Unauthorized - Session expired");
//   }

//   if (!name || !phone) {
//     throw new ApiError(400, "Name and phone are required");
//   }

//   if (name.trim() === "" || phone.trim() === "") {
//     throw new ApiError(400, "Name and phone cannot be empty");
//   }

//   const phoneRegex = /^[6-9]\d{9}$/;
//   if (!phoneRegex.test(phone)) {
//     throw new ApiError(400, "Invalid phone number format");
//   }

//   const existingUser = await prisma.user.findUnique({
//     where: { id: userId },
//   });

//   if (!existingUser) {
//     throw new ApiError(404, "User not found");
//   }

//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       name: name.trim(),
//       phone: phone.trim(),
//       phoneVerified: false, // Reset verification if phone changed
//     },
//     select: {
//       id: true,
//       email: true,
//       name: true,
//       phone: true,
//       phoneVerified: true,
//     },
//   });

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, updatedUser, "User details updated successfully")
//     );
// });

const sendOTP = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { phone } = req.body;

  if (!userId) {
    throw new ApiError(401, "Unauthorized - Session expired");
  }

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new ApiError(400, "Invalid phone number format");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hashedOTP = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.phoneOTP.deleteMany({
    where: { userId },
  });

  // Create new OTP record
  await prisma.phoneOTP.create({
    data: {
      userId,
      phone,
      otp: hashedOTP,
      expiresAt,
      verified: false,
      attempts: 0,
    },
  });

  if (process.env.NODE_ENV === "development") {
    // Development mode - just log OTP, don't send SMS
    console.log("Phone:", phone);
    console.log("OTP:", otp);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          phone,
          otp,
        },
        "OTP sent (dev mode)"
      )
    );
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: otp,
        flash: 0,
        numbers: phone,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.return) {
      throw new Error(data.message || "Failed to send OTP");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { phone }, "OTP sent successfully"));
  } catch (smsError) {
    console.error("Fast2SMS error:", smsError);

    console.log("Phone:", phone);
    console.log("OTP:", otp);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          phone,
          otp,
        },
        "SMS service unavailable. OTP shown for testing."
      )
    );
  }
});

const verifyOTP = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { otp } = req.body;

  if (!userId) {
    throw new ApiError(401, "Unauthorized - Session expired");
  }

  if (!otp || otp.length !== 6) {
    throw new ApiError(400, "Invalid OTP format");
  }

  const otpRecord = await prisma.phoneOTP.findFirst({
    where: {
      userId,
      verified: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    throw new ApiError(404, "No OTP found. Please request a new one.");
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  if (otpRecord.attempts >= 5) {
    throw new ApiError(
      429,
      "Too many failed attempts. Please request a new OTP."
    );
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otp);

  if (!isValid) {
    await prisma.phoneOTP.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    throw new ApiError(400, "Invalid OTP. Please try again.");
  }

  await prisma.phoneOTP.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { verified: true }, "Phone verified successfully")
    );
});

const resendOTP = asyncHandler(async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized - Session expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!user?.phone) {
    throw new ApiError(400, "Phone number not found");
  }

  const recentOTP = await prisma.phoneOTP.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000),
      },
    },
  });

  if (recentOTP) {
    throw new ApiError(
      429,
      "Please wait 60 seconds before requesting a new OTP"
    );
  }

  req.body.phone = user.phone;
  return sendOTP(req, res);
});

const getDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized - Session expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched successfully"));
});

const getAvailableTimeSlots = asyncHandler(async (req, res) => {
  const restaurantIde = 3;
  const userId = req.user.id;
  // const userId = 23;

  const cart = await prisma.cart.findFirst({
    where: {
      userId,
      restaurantId: restaurantIde,
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      // restaurant: true,
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(
      400,
      "Cart is empty. Add items to see available time slots."
    );
  }
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: parseInt(restaurantIde) },
    select: {
      baseWaitingTimeMultiplier: true,
      fixedAdditionalTime: true,
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const maxWaitingTime = cart.items.reduce((max, item) => {
    const actualWaitingTime =
      item.menuItem.waitingTime * restaurant.baseWaitingTimeMultiplier +
      restaurant.fixedAdditionalTime;
    return Math.max(max, actualWaitingTime);
  }, 0);

  const estimatedWaitingTime = Math.round(maxWaitingTime);

  const slots = OrderService.generateTimeSlots(estimatedWaitingTime);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        slots,
        estimatedWaitingTime,
        message: `Earliest pickup available after ${estimatedWaitingTime} minutes`,
      },
      "Time slots generated successfully"
    )
  );
});

const selectTimeSlot = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { slotId } = req.body;

  if (!userId) {
    throw new ApiError(401, "Unauthorized - Session expired");
  }

  if (!slotId) {
    throw new ApiError(400, "Slot ID is required");
  }

  // Verify user details are complete
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, phoneVerified: true },
  });

  if (!user?.name || !user?.phone) {
    throw new ApiError(400, "Please complete your profile first");
  }

  if (!user.phoneVerified) {
    throw new ApiError(400, "Please verify your phone number first");
  }

  // Check if slot exists and is available
  const slot = await prisma.timeSlot.findUnique({
    where: { id: parseInt(slotId) },
  });

  if (!slot) {
    throw new ApiError(404, "Time slot not found");
  }

  if (!slot.isAvailable) {
    throw new ApiError(400, "This time slot is no longer available");
  }

  // Check if slot is in the future
  if (new Date() > slot.slotStart) {
    throw new ApiError(400, "Cannot book past time slots");
  }

  // Check capacity
  if (slot.bookedCount >= slot.capacity) {
    throw new ApiError(400, "This time slot is fully booked");
  }

  // Return slot details (actual booking happens during order creation)
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        slotId: slot.id,
        slotStart: slot.slotStart,
        slotEnd: slot.slotEnd,
        remainingSlots: slot.capacity - slot.bookedCount,
      },
      "Time slot selected successfully"
    )
  );
});

export {
  getDetails,
  getAvailableTimeSlots,
  sendOTP,
  resendOTP,
  verifyOTP,
  selectTimeSlot,
};
