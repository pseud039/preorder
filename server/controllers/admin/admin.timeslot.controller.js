import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  hasOverlap,
  parseDayOfWeek,
  parseTimeString,
  timeToMinutes,
  validateTimeRange,
} from "../../utils/timeslot.utils.js";

// Get all time slots
export const getTimeSlots = asyncHandler(async (req, res) => {
  const { dayOfWeek, isAvailable } = req.query;
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const where = {};

  where.dayOfWeek = dayOfWeek ? parseDayOfWeek(dayOfWeek): currentDayOfWeek;

  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable === "true";
  } else {
    // Default listing should only return currently usable slots.
    where.isAvailable = true;
  }

  const timeSlots = await prisma.timeSlot.findMany({
    where,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const validTimeSlots = timeSlots.filter((slot) => {
    if (slot.dayOfWeek !== currentDayOfWeek) {
      return true;
    }
    // console.log(validTimeSlots);
    return timeToMinutes(slot.startTime) > currentMinutes;
  });

  const groupedSlotsMap = new Map();
  for (const slot of validTimeSlots) {
    if (!groupedSlotsMap.has(slot.dayOfWeek)) {
      groupedSlotsMap.set(slot.dayOfWeek, {
        dayOfWeek: slot.dayOfWeek,
        slots: [],
      });
    }

    groupedSlotsMap.get(slot.dayOfWeek).slots.push({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      bookedCount: slot.bookedCount,
      createdAt: slot.createdAt,
    });
  }

  const groupedSlots = [...groupedSlotsMap.values()];

  res
    .status(200)
    .json(
      new ApiResponse(200, groupedSlots, "Time slots fetched successfully"),
    );
});

// Create a single time slot
export const createTimeSlot = asyncHandler(async (req, res) => {
  const { dayOfWeek, startTime, endTime, isAvailable = true } = req.body;

  if (
    dayOfWeek === undefined ||
    startTime === undefined ||
    endTime === undefined
  ) {
    throw new ApiError(400, "dayOfWeek, startTime, and endTime are required");
  }

  const parsedDay = parseDayOfWeek(dayOfWeek);
  const parsedStartTime = parseTimeString(startTime, "startTime");
  const parsedEndTime = parseTimeString(endTime, "endTime");
  validateTimeRange(parsedStartTime, parsedEndTime);

  const daySlots = await prisma.timeSlot.findMany({
    where: { dayOfWeek: parsedDay },
    select: { startTime: true, endTime: true },
  });

  if (hasOverlap(parsedStartTime, parsedEndTime, daySlots)) {
    throw new ApiError(409, "Time slot overlaps with an existing slot");
  }

  const timeSlot = await prisma.timeSlot.create({
    data: {
      dayOfWeek: parsedDay,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      isAvailable,
      bookedCount: 0,
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, timeSlot, "Time slot created successfully"));
});

// Batch create time slots (for bulk generation)
// Batch create time slots (for bulk generation)
export const batchCreateTimeSlots = asyncHandler(async (req, res) => {
  const { slots } = req.body;

  if (!Array.isArray(slots) || slots.length === 0) {
    throw new ApiError(400, "slots array is required and must not be empty");
  }

  const normalizedSlots = slots.map((slot) => {
    if (
      slot.dayOfWeek === undefined ||
      slot.startTime === undefined ||
      slot.endTime === undefined
    ) {
      throw new ApiError(
        400,
        "Each slot must have dayOfWeek, startTime, and endTime",
      );
    }

    const parsedDay = parseDayOfWeek(slot.dayOfWeek);
    const parsedStartTime = parseTimeString(slot.startTime, "startTime");
    const parsedEndTime = parseTimeString(slot.endTime, "endTime");
    validateTimeRange(parsedStartTime, parsedEndTime);

    return {
      dayOfWeek: parsedDay,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      isAvailable: slot.isAvailable ?? true,
      bookedCount: 0,
    };
  });

  const slotsByDay = new Map();
  for (const slot of normalizedSlots) {
    if (!slotsByDay.has(slot.dayOfWeek)) {
      slotsByDay.set(slot.dayOfWeek, []);
    }
    slotsByDay.get(slot.dayOfWeek).push(slot);
  }

  for (const [dayOfWeek, daySlots] of slotsByDay.entries()) {
    const sortedSlots = daySlots.sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );

    for (let i = 1; i < sortedSlots.length; i++) {
      const previous = sortedSlots[i - 1];
      const current = sortedSlots[i];

      if (timeToMinutes(previous.endTime) > timeToMinutes(current.startTime)) {
        throw new ApiError(
          409,
          `Overlapping slots found for dayOfWeek ${dayOfWeek}`,
        );
      }
    }
  }

  // Delete existing slots (optional - you can modify this behavior)
  const daysToUpdate = [
    ...new Set(normalizedSlots.map((slot) => slot.dayOfWeek)),
  ];
  await prisma.timeSlot.deleteMany({
    where: {
      dayOfWeek: { in: daysToUpdate },
    },
  });

  // Create new slots
  const createdSlots = await prisma.timeSlot.createMany({
    data: normalizedSlots,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { count: createdSlots.count },
        `Successfully created ${createdSlots.count} time slot(s)`,
      ),
    );
});

// Update a time slot
export const updateTimeSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dayOfWeek, startTime, endTime, isAvailable } = req.body;

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!timeSlot) {
    throw new ApiError(404, "Time slot not found");
  }

  const updateData = {};

  const nextDay =
    dayOfWeek !== undefined ? parseDayOfWeek(dayOfWeek) : timeSlot.dayOfWeek;
  const nextStartTime =
    startTime !== undefined
      ? parseTimeString(startTime, "startTime")
      : timeSlot.startTime;
  const nextEndTime =
    endTime !== undefined
      ? parseTimeString(endTime, "endTime")
      : timeSlot.endTime;

  validateTimeRange(nextStartTime, nextEndTime);

  const requiresOverlapValidation =
    dayOfWeek !== undefined || startTime !== undefined || endTime !== undefined;

  if (requiresOverlapValidation) {
    const daySlots = await prisma.timeSlot.findMany({
      where: {
        dayOfWeek: nextDay,
        id: { not: parseInt(id, 10) },
      },
      select: { startTime: true, endTime: true },
    });

    if (hasOverlap(nextStartTime, nextEndTime, daySlots)) {
      throw new ApiError(409, "Time slot overlaps with an existing slot");
    }
  }

  if (dayOfWeek !== undefined) {
    updateData.dayOfWeek = nextDay;
  }

  if (startTime !== undefined) {
    updateData.startTime = nextStartTime;
  }

  if (endTime !== undefined) {
    updateData.endTime = nextEndTime;
  }

  if (isAvailable !== undefined) {
    updateData.isAvailable = isAvailable;
  }

  const updatedSlot = await prisma.timeSlot.update({
    where: { id: parseInt(id, 10) },
    data: updateData,
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedSlot, "Time slot updated successfully"));
});

// Delete a time slot
export const deleteTimeSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  if (!timeSlot) {
    throw new ApiError(404, "Time slot not found");
  }

  // Check if slot has orders
  if (timeSlot._count.orders > 0) {
    throw new ApiError(
      400,
      "Cannot delete time slot with existing orders. Disable it instead.",
    );
  }

  await prisma.timeSlot.delete({
    where: { id: parseInt(id, 10) },
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Time slot deleted successfully"));
});

// Delete all time slots for a specific day
export const deleteTimeSlotsForDay = asyncHandler(async (req, res) => {
  const { dayOfWeek } = req.params;

  if (dayOfWeek === undefined) {
    throw new ApiError(400, "dayOfWeek is required");
  }

  const day = parseDayOfWeek(dayOfWeek);

  // Check if any slots have orders
  const slotsWithOrders = await prisma.timeSlot.findMany({
    where: {
      dayOfWeek: day,
      orders: {
        some: {},
      },
    },
  });

  if (slotsWithOrders.length > 0) {
    throw new ApiError(
      400,
      `${slotsWithOrders.length} time slot(s) have existing orders. Disable them instead.`,
    );
  }

  const result = await prisma.timeSlot.deleteMany({
    where: { dayOfWeek: day },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: result.count },
        `Deleted ${result.count} time slot(s)`,
      ),
    );
});
