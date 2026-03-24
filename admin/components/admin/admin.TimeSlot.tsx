"use client";
import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Calendar, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TimeSlot {
  id?: number;
  dayOfWeek: number;
  slotStart: string;
  slotEnd: string;
  isAvailable: boolean;
}

interface DaySlots {
  [key: number]: TimeSlot[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export default function TimeSlotManagement() {
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(true);
  const [daySlots, setDaySlots] = useState<DaySlots>({});
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [slotDuration, setSlotDuration] = useState("30");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/admin/timeslots`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const grouped: DaySlots = {};
          data.data.forEach((dayGroup: any) => {
            if (!grouped[dayGroup.dayOfWeek]) {
              grouped[dayGroup.dayOfWeek] = [];
            }

            const slots = Array.isArray(dayGroup.slots) ? dayGroup.slots : [];
            slots.forEach((slot: any) => {
              grouped[dayGroup.dayOfWeek].push({
                id: slot.id,
                dayOfWeek: dayGroup.dayOfWeek,
                slotStart: slot.startTime,
                slotEnd: slot.endTime,
                isAvailable: slot.isAvailable,
              });
            });
          });
          setDaySlots(grouped);
        }
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Failed to load time slots");
    } finally {
      setFetchingSlots(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const generateSlots = () => {
    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    if (!startTime || !endTime) {
      toast.error("Please select start and end times");
      return;
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      toast.error("End time must be after start time");
      return;
    }

    const duration = parseInt(slotDuration);
    const newSlots: DaySlots = { ...daySlots };

    selectedDays.forEach((day) => {
      const slots: TimeSlot[] = [];
      let currentMinutes = startMinutes;

      while (currentMinutes < endMinutes) {
        const slotEndMinutes = currentMinutes + duration;
        
        if (slotEndMinutes <= endMinutes) {
          const formatTime = (totalMinutes: number) => {
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          };

          slots.push({
            dayOfWeek: day,
            slotStart: formatTime(currentMinutes),
            slotEnd: formatTime(slotEndMinutes),
            isAvailable: true,
          });
        }
        
        currentMinutes = slotEndMinutes;
      }

      newSlots[day] = slots;
    });

    setDaySlots(newSlots);
    toast.success(`Generated slots for ${selectedDays.length} day(s)`);
  };

  const removeSlot = async (day: number, index: number) => {
    const slot = daySlots[day][index];
    
    // If slot has an ID, it exists in the backend - delete it
    if (slot.id) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/admin/timeslots/${slot.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to delete time slot");
          return;
        }

        toast.success("Time slot deleted");
      } catch (error) {
        console.error("Error deleting time slot:", error);
        toast.error("Failed to delete time slot");
        return;
      }
    }

    // Update local state
    setDaySlots((prev) => {
      const updated = { ...prev };
      updated[day] = updated[day].filter((_, i) => i !== index);
      if (updated[day].length === 0) {
        delete updated[day];
      }
      return updated;
    });
  };

  const toggleSlotAvailability = async (day: number, index: number) => {
    const slot = daySlots[day][index];
    const newAvailability = !slot.isAvailable;

    // If slot has an ID, update in backend
    if (slot.id) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/admin/timeslots/${slot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isAvailable: newAvailability }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to update time slot");
          return;
        }
      } catch (error) {
        console.error("Error updating time slot:", error);
        toast.error("Failed to update time slot");
        return;
      }
    }

    // Update local state
    setDaySlots((prev) => {
      const updated = { ...prev };
      updated[day] = [...updated[day]];
      updated[day][index] = {
        ...updated[day][index],
        isAvailable: newAvailability
      };
      return updated;
    });
  };

  const clearDay = async (day: number) => {
    const dayName = DAYS_OF_WEEK.find((d) => d.value === day)?.label;
    
    if (!confirm(`Are you sure you want to delete all slots for ${dayName}?`)) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/admin/timeslots/day/${day}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to clear day");
        return;
      }

      // Update local state
      setDaySlots((prev) => {
        const updated = { ...prev };
        delete updated[day];
        return updated;
      });

      toast.success(`Cleared ${data.data?.count || 0} slot(s) for ${dayName}`);
    } catch (error) {
      console.error("Error clearing day:", error);
      toast.error("Failed to clear day");
    }
  };

  const saveTimeSlots = async () => {
    const allSlots: TimeSlot[] = [];
    Object.values(daySlots).forEach((slots) => {
      allSlots.push(...slots);
    });

    if (allSlots.length === 0) {
      toast.error("No time slots to save");
      return;
    }

    setLoading(true);
    try {
      const slotsToSave = allSlots.map((slot) => {
        return {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.slotStart,
          endTime: slot.slotEnd,
          isAvailable: slot.isAvailable,
        };
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/admin/timeslots/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slots: slotsToSave }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save time slots");
      }

      toast.success(`Successfully saved ${allSlots.length} time slot(s)`);
      await fetchTimeSlots();
    } catch (error: any) {
      console.error("Error saving time slots:", error);
      toast.error(error.message || "Failed to save time slots");
    } finally {
      setLoading(false);
    }
  };

  const getTotalSlots = () => {
    return Object.values(daySlots).reduce((sum, slots) => sum + slots.length, 0);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-orange-600" />
            Time Slot Management
          </h1>
          <p className="text-gray-600 mt-1">
            Configure available pickup time slots for your restaurant
          </p>
        </div>
        <Button
          onClick={saveTimeSlots}
          disabled={loading || getTotalSlots() === 0}
          size="lg"
          className="bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Slots ({getTotalSlots()})
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate Time Slots
          </CardTitle>
          <CardDescription>
            Create recurring time slots for selected days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Select Days
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDay(day.value)}
                  className={
                    selectedDays.includes(day.value)
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : ""
                  }
                >
                  {day.short}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
              >
                Weekdays
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDays([0, 6])}
              >
                Weekends
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
              >
                All Days
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="duration">Slot Duration</Label>
              <Select value={slotDuration} onValueChange={setSlotDuration}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateSlots}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Slots
          </Button>
        </CardContent>
      </Card>

      {Object.keys(daySlots).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Configured Time Slots
            </CardTitle>
            <CardDescription>
              Review and manage your time slots by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const slots = daySlots[day.value];
                  if (!slots || slots.length === 0) return null;

                  return (
                    <div key={day.value} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">
                          {day.label} ({slots.length} slot
                          {slots.length !== 1 ? "s" : ""})
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearDay(day.value)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear Day
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {slots.map((slot, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={slot.isAvailable}
                                onCheckedChange={() =>
                                  toggleSlotAvailability(day.value, index)
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSlot(day.value, index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {slot.slotStart} - {slot.slotEnd}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-sm px-3 py-1 rounded ${
                                slot.isAvailable
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {slot.isAvailable ? "Available" : "Disabled"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {Object.keys(daySlots).length === 0 && !fetchingSlots && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No time slots configured</p>
              <p className="text-sm">Use the generator above to create time slots</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}