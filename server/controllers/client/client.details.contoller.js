import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { prisma } from "../../lib/prisma.js";
import { OrderService } from "../../utils/order.service.js";
import bcrypt from "bcrypt";
import Restraunt_ID from "../../utils/constant.js";

const MAX_BOOKINGS_PER_SLOT = 30;

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
  const userId = req.user.id;
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

  // Delete any existing OTP records for this user
  await prisma.phoneOTP.deleteMany({
    where: { userId },
  });

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (process.env.NODE_ENV === "development") {
    // Development mode - generate local OTP for testing
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await prisma.phoneOTP.create({
      data: {
        userId,
        phone,
        otp: hashedOTP, // Store hashed OTP for dev mode
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

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
    const response = await fetch(
      `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    if (data.Status !== "Success") {
      throw new Error(data.Details || "Failed to send OTP");
    }

    // Store session ID from 2factor.in for verification
    await prisma.phoneOTP.create({
      data: {
        userId,
        phone,
        otp: data.Details, // Store session ID from 2factor.in
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { phone }, "OTP sent successfully"));
  } catch (smsError) {
    console.error("2factor.in error:", smsError);

    // Fallback for testing if SMS service fails
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

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
  const userId = req.user.id;
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

  let isValid = false;

  // Check if it's a 2factor.in session ID (production) or hashed OTP (dev/fallback)
  const isSessionId = !otpRecord.otp.startsWith("$2"); // bcrypt hashes start with $2

  if (process.env.NODE_ENV === "development" || !isSessionId) {
    // Dev mode or fallback - verify using bcrypt
    isValid = await bcrypt.compare(otp, otpRecord.otp);
  } else {
    // Production - verify using 2factor.in API
    try {
      const response = await fetch(
        `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/VERIFY/${otpRecord.otp}/${otp}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      isValid = data.Status === "Success";
    } catch (error) {
      console.error("2factor.in verification error:", error);
      throw new ApiError(500, "OTP verification service unavailable");
    }
  }

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
      phone: otpRecord.phone,
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
  const userId = req.user.id;

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
      phoneVerified:true,
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
  const restaurantIde = Restraunt_ID;
  const userId = req.user.id;
  console.log('🚨 === BEFORE EVERYTHING ===');
  const beforeCount = await prisma.timeSlot.count();
  console.log('Total slots in DB:', beforeCount);
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
console.log('🚨 === BEFORE generateTimeSlots ===');
  const beforeGenCount = await prisma.timeSlot.count();
  console.log('Total slots before generation:', beforeGenCount);
  const slots = await OrderService.generateTimeSlots(estimatedWaitingTime);
 console.log('🚨 === AFTER generateTimeSlots ===');
  const afterGenCount = await prisma.timeSlot.count();
  console.log('Total slots after generation:', afterGenCount);
  console.log('New slots created:', afterGenCount - beforeGenCount);

  // Handle case when no slots are available
  if (slots.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          slots: [],
          estimatedWaitingTime,
          message: "No time slots available at the moment. Restaurant may be closed or fully booked.",
        },
        "No available time slots"
      )
    );
  }

  // Calculate earliest available slot time for the message
  const earliestSlot = slots[0];
  const earliestTime = new Date(earliestSlot.scheduledAt);
  const now = new Date();
  const minutesUntilEarliest = Math.round((earliestTime - now) / (60 * 1000));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        slots,
        estimatedWaitingTime,
        earliestAvailableAt: earliestSlot.scheduledAt,
        message: `Earliest pickup: ${earliestSlot.dayLabel} at ${earliestSlot.label.split(' - ')[0]} (in ~${minutesUntilEarliest} mins)`,
      },
      "Time slots fetched successfully"
    )
  );
});

const selectTimeSlot = asyncHandler(async (req, res) => {
  const userId = req.user.id;
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

  // Check capacity
  if (slot.bookedCount >= MAX_BOOKINGS_PER_SLOT) {
    throw new ApiError(400, "This time slot is fully booked");
  }

  // Return slot details (actual booking happens during order creation)
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        slotId: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        remainingSlots: MAX_BOOKINGS_PER_SLOT - slot.bookedCount,
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
