"use client";
import React, { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/auth";

interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookedCount?: number;
}

interface DaySlots {
  dayOfWeek: number;
  dayLabel: string;
  slots: TimeSlot[];
}

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSlotSelect: (slotId: number) => void;
}

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimeSlotModal({
  isOpen,
  onClose,
  onSlotSelect,
}: TimeSlotModalProps) {
  const [slots, setSlots] = useState<DaySlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSlots();
    }
  }, [isOpen]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("auth_token");

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/timeslots`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch slots");
      }

      const groupedSlots = Array.isArray(data?.data) ? data.data : [];
      const normalizedSlots: DaySlots[] = groupedSlots
        .map((dayGroup: any) => {
          const dayOfWeek = Number(dayGroup.dayOfWeek);

          return {
            dayOfWeek,
            dayLabel: DAY_LABELS[dayOfWeek] || `Day ${dayOfWeek}`,
            slots: Array.isArray(dayGroup.slots)
              ? dayGroup.slots.map((slot: any) => ({
                  id: slot.id,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  isAvailable: Boolean(slot.isAvailable),
                  bookedCount: slot.bookedCount,
                }))
              : [],
          };
        })
        .sort((a: DaySlots, b: DaySlots) => a.dayOfWeek - b.dayOfWeek);

      setSelectedSlot(null);
      setSlots(normalizedSlots);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load time slots";
      console.error("Error fetching slots:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return time;
    }

    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
      setError("");
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }

    try {
      setSubmitting(true);
      onSlotSelect(selectedSlot.id);
      toast.success("Time slot selected!");
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to select time slot";
      console.error("Error selecting slot:", err);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center z-100 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Select Pickup Time
              </h2>
              <p className="text-sm text-gray-600">Choose a convenient slot</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : error && slots.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unable to Load Slots
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchAvailableSlots}
                  className="text-orange-500 hover:text-orange-600 font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Slots Available
                </h3>
                <p className="text-gray-600">
                  Please check back later for available time slots
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {slots.map((daySlots) => (
                  <div
                    key={daySlots.dayOfWeek}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="w-5 h-5" />
                        <h3 className="font-semibold">{daySlots.dayLabel}</h3>
                      </div>
                      <p className="text-orange-100 text-sm mt-1">
                        Weekly recurring slots
                      </p>
                    </div>

                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {daySlots.slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const isDisabled = !slot.isAvailable;

                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotClick(slot)}
                            disabled={isDisabled}
                            className={`
                              relative p-4 rounded-lg border-2 transition-all text-left
                              ${
                                isSelected
                                  ? "border-orange-500 bg-orange-50"
                                  : isDisabled
                                    ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                                    : "border-gray-200 hover:border-orange-300 bg-white"
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="w-5 h-5 text-orange-500 fill-current" />
                              </div>
                            )}

                            <div className="flex items-center gap-2 mb-2">
                              <Clock
                                className={`w-4 h-4 ${
                                  isSelected
                                    ? "text-orange-500"
                                    : isDisabled
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                }`}
                              />
                              <span
                                className={`font-semibold text-sm ${
                                  isDisabled ? "text-gray-400" : "text-gray-900"
                                }`}
                              >
                                {formatTime(slot.startTime)}
                              </span>
                            </div>

                            <div className="text-xs text-gray-600">
                              to {formatTime(slot.endTime)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && !loading && slots.length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Selected Time:</span>
                  <span className="font-semibold text-gray-900">
                    {formatTime(selectedSlot.startTime)} -{" "}
                    {formatTime(selectedSlot.endTime)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Time Slot"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
