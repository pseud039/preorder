import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

// Get all time slots
export const getTimeSlots = asyncHandler(async (req, res) => {
  const { dayOfWeek, isAvailable } = req.query;

  const where = {};

  if (dayOfWeek !== undefined) {
    where.dayOfWeek = parseInt(dayOfWeek);
  }

  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable === "true";
  }

  const timeSlots = await prisma.timeSlot.findMany({
    where,
    orderBy: [{ dayOfWeek: "asc" }, { slotStart: "asc" }],
  });

  res.status(200).json(
    new ApiResponse(200, timeSlots, "Time slots fetched successfully")
  );
});

// Create a single time slot
export const createTimeSlot = asyncHandler(async (req, res) => {
  const { dayOfWeek, slotStart, slotEnd, isAvailable = true } = req.body;

  if (dayOfWeek === undefined || !slotStart || !slotEnd) {
    throw new ApiError(400, "dayOfWeek, slotStart, and slotEnd are required");
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new ApiError(400, "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)");
  }

  const startDate = new Date(slotStart);
  const endDate = new Date(slotEnd);

  if (startDate >= endDate) {
    throw new ApiError(400, "slotStart must be before slotEnd");
  }

  // Check for overlapping slots on the same day
  const overlapping = await prisma.timeSlot.findFirst({
    where: {
      dayOfWeek: parseInt(dayOfWeek),
      OR: [
        {
          AND: [
            { slotStart: { lte: startDate } },
            { slotEnd: { gt: startDate } },
          ],
        },
        {
          AND: [
            { slotStart: { lt: endDate } },
            { slotEnd: { gte: endDate } },
          ],
        },
        {
          AND: [
            { slotStart: { gte: startDate } },
            { slotEnd: { lte: endDate } },
          ],
        },
      ],
    },
  });

  if (overlapping) {
    throw new ApiError(409, "Time slot overlaps with an existing slot");
  }

  const timeSlot = await prisma.timeSlot.create({
    data: {
      dayOfWeek: parseInt(dayOfWeek),
      slotStart: startDate,
      slotEnd: endDate,
      isAvailable,
      bookedCount: 0,
    },
  });

  res.status(201).json(
    new ApiResponse(201, timeSlot, "Time slot created successfully")
  );
});

// Batch create time slots (for bulk generation)
export const batchCreateTimeSlots = asyncHandler(async (req, res) => {
  const { slots } = req.body;

  if (!Array.isArray(slots) || slots.length === 0) {
    throw new ApiError(400, "slots array is required and must not be empty");
  }

  // Validate all slots
  for (const slot of slots) {
    if (slot.dayOfWeek === undefined || !slot.slotStart || !slot.slotEnd) {
      throw new ApiError(400, "Each slot must have dayOfWeek, slotStart, and slotEnd");
    }

    if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      throw new ApiError(400, "dayOfWeek must be between 0 and 6");
    }

    const startDate = new Date(slot.slotStart);
    const endDate = new Date(slot.slotEnd);

    if (startDate >= endDate) {
      throw new ApiError(400, "slotStart must be before slotEnd");
    }
  }

  // Delete existing slots (optional - you can modify this behavior)
  const daysToUpdate = [...new Set(slots.map((s) => s.dayOfWeek))];
  await prisma.timeSlot.deleteMany({
    where: {
      dayOfWeek: { in: daysToUpdate },
    },
  });

  // Create new slots
  const createdSlots = await prisma.timeSlot.createMany({
    data: slots.map((slot) => ({
      dayOfWeek: parseInt(slot.dayOfWeek),
      slotStart: new Date(slot.slotStart),
      slotEnd: new Date(slot.slotEnd),
      isAvailable: slot.isAvailable ?? true,
      bookedCount: 0,
    })),
  });

  res.status(201).json(
    new ApiResponse(
      201,
      { count: createdSlots.count },
      `Successfully created ${createdSlots.count} time slot(s)`
    )
  );
});

// Update a time slot
export const updateTimeSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slotStart, slotEnd, isAvailable } = req.body;

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: parseInt(id) },
  });

  if (!timeSlot) {
    throw new ApiError(404, "Time slot not found");
  }

  const updateData = {};

  if (slotStart !== undefined) {
    updateData.slotStart = new Date(slotStart);
  }

  if (slotEnd !== undefined) {
    updateData.slotEnd = new Date(slotEnd);
  }

  if (isAvailable !== undefined) {
    updateData.isAvailable = isAvailable;
  }

  // Validate time range if updating
  if (updateData.slotStart || updateData.slotEnd) {
    const start = updateData.slotStart || timeSlot.slotStart;
    const end = updateData.slotEnd || timeSlot.slotEnd;

    if (start >= end) {
      throw new ApiError(400, "slotStart must be before slotEnd");
    }
  }

  const updatedSlot = await prisma.timeSlot.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  res.status(200).json(
    new ApiResponse(200, updatedSlot, "Time slot updated successfully")
  );
});

// Delete a time slot
export const deleteTimeSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: parseInt(id) },
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
      "Cannot delete time slot with existing orders. Disable it instead."
    );
  }

  await prisma.timeSlot.delete({
    where: { id: parseInt(id) },
  });

  res.status(200).json(
    new ApiResponse(200, null, "Time slot deleted successfully")
  );
});

// Delete all time slots for a specific day
export const deleteTimeSlotsForDay = asyncHandler(async (req, res) => {
  const { dayOfWeek } = req.params;

  if (dayOfWeek === undefined) {
    throw new ApiError(400, "dayOfWeek is required");
  }

  const day = parseInt(dayOfWeek);

  if (day < 0 || day > 6) {
    throw new ApiError(400, "dayOfWeek must be between 0 and 6");
  }

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
      `${slotsWithOrders.length} time slot(s) have existing orders. Disable them instead.`
    );
  }

  const result = await prisma.timeSlot.deleteMany({
    where: { dayOfWeek: day },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { count: result.count },
      `Deleted ${result.count} time slot(s)`
    )
  );
});
