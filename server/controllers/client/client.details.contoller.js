import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcrypt";

const updateDetails = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, phone } = req.body;
  if (!userId) {
    throw new ApiError(401, "Unauthorized - Session expired");
  }

  if (!name || !phone) {
    throw new ApiError(400, "Name and phone are required");
  }

  if (name.trim() === "" || phone.trim() === "") {
    throw new ApiError(400, "Name and phone cannot be empty");
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new ApiError(400, "Invalid phone number format");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      phone: phone.trim(),
      phoneVerified: false, // Reset verification if phone changed
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      phoneVerified: true,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "User details updated successfully")
    );
});

const sendOTP = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { phone } = req.body;

  if (!userId) {
    throw new ApiError(401, "Unauthorized - Session expired");
  }

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  // Validate phone
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new ApiError(400, "Invalid phone number format");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP before storing
  const hashedOTP = await bcrypt.hash(otp, 10);

  // Set expiry (10 minutes from now)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Delete old OTPs for this user
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

  // Send OTP based on environment
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

  // Production mode - Send OTP via Fast2SMS
  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
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

    // Fallback to dev mode if SMS fails
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

  // Get user's phone
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!user?.phone) {
    throw new ApiError(400, "Phone number not found");
  }

  // Check if user requested OTP recently (rate limit: 60 seconds)
  const recentOTP = await prisma.phoneOTP.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000), // Last 60 seconds
      },
    },
  });

  if (recentOTP) {
    throw new ApiError(
      429,
      "Please wait 60 seconds before requesting a new OTP"
    );
  }

  // Use the sendOTP function
  req.body.phone = user.phone;
  return sendOTP(req, res);
});

const getDetails = asyncHandler(async (req, res) => {
  const userId = req.userId;

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

const getAvailableSlots = asyncHandler(async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized - Session expired");
  }

  // Calculate date range (today + next 2 days = 3 days total)
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfThirdDay = new Date(startOfToday);
  endOfThirdDay.setDate(endOfThirdDay.getDate() + 3);
  endOfThirdDay.setHours(23, 59, 59, 999);

  // Fetch available slots
  const slots = await prisma.timeSlot.findMany({
    where: {
      slotStart: {
        gte: new Date(), // Only future slots
        lte: endOfThirdDay,
      },
      isAvailable: true,
    },
    orderBy: {
      slotStart: "asc",
    },
    select: {
      id: true,
      slotStart: true,
      slotEnd: true,
      capacity: true,
      bookedCount: true,
      isAvailable: true,
    },
  });

  // Group slots by date
  const groupedSlots = {};

  slots.forEach((slot) => {
    // Check if slot is full
    const isFull = slot.bookedCount >= slot.capacity;
    const remainingSlots = slot.capacity - slot.bookedCount;

    // Skip if full
    if (isFull) return;

    const date = slot.slotStart.toISOString().split("T")[0];

    if (!groupedSlots[date]) {
      groupedSlots[date] = [];
    }

    groupedSlots[date].push({
      ...slot,
      remainingSlots,
      isFull,
    });
  });

  // Format response with day labels
  const formattedSlots = Object.entries(groupedSlots).map(([date, slots]) => {
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dayLabel;
    const diffDays = Math.floor((slotDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) dayLabel = "Today";
    else if (diffDays === 1) dayLabel = "Tomorrow";
    else
      dayLabel = slotDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

    return {
      date,
      dayLabel,
      slots,
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedSlots,
        "Available slots fetched successfully"
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

const createTimeSlots = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { date, slots } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    throw new ApiError(403, "Only admins can create time slots");
  }

  if (!date || !slots || !Array.isArray(slots)) {
    throw new ApiError(400, "Date and slots array are required");
  }

  // Create slots
  const createdSlots = [];

  for (const slot of slots) {
    const { startTime, endTime, capacity = 10 } = slot;

    // Parse date and time
    const slotStart = new Date(`${date}T${startTime}:00`);
    const slotEnd = new Date(`${date}T${endTime}:00`);

    // Check if slot already exists
    const existing = await prisma.timeSlot.findFirst({
      where: {
        slotStart,
        slotEnd,
      },
    });

    if (!existing) {
      const created = await prisma.timeSlot.create({
        data: {
          slotStart,
          slotEnd,
          capacity,
          bookedCount: 0,
          isAvailable: true,
        },
      });
      createdSlots.push(created);
    }
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdSlots,
        `${createdSlots.length} time slots created successfully`
      )
    );
});

const generateTimeSlots = asyncHandler(async (req, res) => {
  const { startDate, endDate, timeSlots, capacity = 10 } = req.body;

  if (!startDate || !endDate || !timeSlots) {
    throw new ApiError(
      400,
      "Start date, end date, and time slots are required"
    );
  }

  const createdSlots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split("T")[0];

    for (const timeSlot of timeSlots) {
      const [startTime, endTime] = timeSlot.split("-");

      const slotStart = new Date(`${dateStr}T${startTime}:00`);
      const slotEnd = new Date(`${dateStr}T${endTime}:00`);

      const existing = await prisma.timeSlot.findFirst({
        where: { slotStart, slotEnd },
      });

      if (!existing) {
        const created = await prisma.timeSlot.create({
          data: {
            slotStart,
            slotEnd,
            capacity,
            bookedCount: 0,
            isAvailable: true,
          },
        });
        createdSlots.push(created);
      }
    }
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { count: createdSlots.length },
        `${createdSlots.length} time slots generated successfully`
      )
    );
});
export {
  getDetails,
  getAvailableSlots,
  updateDetails,
  sendOTP,
  resendOTP,
  verifyOTP,
  selectTimeSlot,
  createTimeSlots,
  generateTimeSlots,
};
