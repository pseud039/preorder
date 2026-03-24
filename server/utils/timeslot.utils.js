import { ApiError } from "./ApiError.js";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const parseDayOfWeek = (value) => {
  const day = parseInt(value, 10);

  if (Number.isNaN(day) || day < 0 || day > 6) {
    throw new ApiError(
      400,
      "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)",
    );
  }

  return day;
};

export const parseTimeString = (value, fieldName) => {
  if (typeof value !== "string" || !TIME_24H_REGEX.test(value)) {
    throw new ApiError(400, `${fieldName} must be in HH:MM 24-hour format`);
  }

  return value;
};

export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const validateTimeRange = (startTime, endTime) => {
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new ApiError(400, "startTime must be before endTime");
  }
};

export const hasOverlap = (startTime, endTime, existingSlots) => {
  const nextStart = timeToMinutes(startTime);
  const nextEnd = timeToMinutes(endTime);

  return existingSlots.some((slot) => {
    const currentStart = timeToMinutes(slot.startTime);
    const currentEnd = timeToMinutes(slot.endTime);
    return nextStart < currentEnd && nextEnd > currentStart;
  });
};
