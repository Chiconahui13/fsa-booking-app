"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";

type Setting = {
  id: number;
  slot_length: number;
  slot_intervall: number;
  availability_start: string;
  availability_end: string;
};

type Car = {
  id: number;
  number: string;
  university: string;
  is_active: boolean;
};

type Props = {
  setting: Setting;
};

type Slot = {
  start: Date;
  end: Date;
};

type BookedSlot = {
  start_at: string;
  end_at: string;
};

type Booking = {
  id: number;
  user_email: string;
  car_id: number;
  start_at: string;
  end_at: string;
  settings_id: number;
  status: string;
};

const formatSlot = (start: Date, end: Date) => {
  return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const generateSlots = (start: string, end: string, slotLength: number, interval: number): Slot[] => {
  const slots: Slot[] = [];
  let currentStart = new Date(start);
  const availabilityEnd = new Date(end);

  while (true) {
    const currentEnd = new Date(currentStart.getTime() + slotLength * 60000);
    if (currentEnd > availabilityEnd) break;
    slots.push({ start: new Date(currentStart), end: currentEnd });
    currentStart = new Date(currentStart.getTime() + interval * 60000);
    if (currentStart >= availabilityEnd) break;
  }

  return slots;
};

export default function BookingSlotForm({ setting }: Props) {
  const [carId, setCarId] = useState<number | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  // Change booking form state
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeCarId, setChangeCarId] = useState<number | null>(null);
  const [changeEmail, setChangeEmail] = useState("");
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [changeStatus, setChangeStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedNewSlot, setSelectedNewSlot] = useState<number | null>(null);
  const [isChangingBooking, setIsChangingBooking] = useState(false);

  useEffect(() => {
    const loadCars = async () => {
      const response = await fetch("/api/cars");
      if (!response.ok) {
        setIsLoadingCars(false);
        return;
      }
      const data: Car[] = await response.json();
      setCars(data);
      if (data.length > 0) {
        setCarId(data[0].id);
      }
      setIsLoadingCars(false);
    };

    loadCars();
  }, []);

  useEffect(() => {
    const loadBookedSlots = async () => {
      const response = await fetch("/api/bookings");
      if (!response.ok) return;
      const allBookings = await response.json();
      const settingBookings = allBookings.filter((booking: any) => booking.settings_id === setting.id);
      setBookedSlots(settingBookings);
    };

    loadBookedSlots();
  }, [setting.id]);

  const slots = useMemo(
    () => generateSlots(setting.availability_start, setting.availability_end, setting.slot_length, setting.slot_intervall),
    [setting]
  );

  const isSlotBooked = (slot: Slot): boolean => {
    return bookedSlots.some((bookedSlot) => {
      const bookedStart = new Date(bookedSlot.start_at).getTime();
      const bookedEnd = new Date(bookedSlot.end_at).getTime();
      const slotStart = slot.start.getTime();
      const slotEnd = slot.end.getTime();
      return slotStart === bookedStart && slotEnd === bookedEnd;
    });
  };

  const canSubmit = carId !== null && email.trim() !== "" && selectedSlot !== null && !isLoadingCars;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || selectedSlot === null) return;

    setIsSubmitting(true);
    setStatus(null);

    const slot = slots[selectedSlot];
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: email,
        car_id: carId,
        start_at: slot.start.toISOString(),
        end_at: slot.end.toISOString(),
        settings_id: setting.id,
      }),
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus({ type: "error", message: result.error || "Failed to save booking." });
      return;
    }

    setStatus({ type: "success", message: "Booking saved successfully." });
  };

  const handleLookupBooking = async () => {
    if (changeCarId === null || !changeEmail.trim()) {
      setChangeStatus({ type: "error", message: "Please select car and enter email" });
      return;
    }

    setIsLookingUp(true);
    setChangeStatus(null);
    setExistingBooking(null);
    setSelectedNewSlot(null);

    const response = await fetch("/api/bookings");
    if (!response.ok) {
      setChangeStatus({ type: "error", message: "Failed to load bookings" });
      setIsLookingUp(false);
      return;
    }

    const allBookings: Booking[] = await response.json();
    const found = allBookings.find(
      (booking) =>
        booking.settings_id === setting.id &&
        booking.user_email.toLowerCase() === changeEmail.toLowerCase() &&
        booking.car_id === changeCarId
    );

    if (!found) {
      setChangeStatus({ type: "error", message: "No booking found for this car and email" });
    } else {
      setExistingBooking(found);
      setChangeStatus(null);
    }

    setIsLookingUp(false);
  };

  const handleChangeBooking = async () => {
    if (!existingBooking || selectedNewSlot === null) {
      setChangeStatus({ type: "error", message: "Please select a new slot" });
      return;
    }

    setIsChangingBooking(true);
    setChangeStatus(null);

    const newSlot = slots[selectedNewSlot];
    const response = await fetch(`/api/bookings/${existingBooking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: existingBooking.user_email,
        car_id: existingBooking.car_id,
        start_at: newSlot.start.toISOString(),
        end_at: newSlot.end.toISOString(),
        status: "confirmed",
      }),
    });

    const result = await response.json();
    setIsChangingBooking(false);

    if (!response.ok) {
      setChangeStatus({ type: "error", message: result.error || "Failed to change booking" });
      return;
    }

    setChangeStatus({ type: "success", message: "Booking changed successfully" });
    setExistingBooking(null);
    setChangeCarId(null);
    setChangeEmail("");
    setSelectedNewSlot(null);

    // Reload booked slots
    const bookingsResponse = await fetch("/api/bookings");
    if (bookingsResponse.ok) {
      const allBookings = await bookingsResponse.json();
      const settingBookings = allBookings.filter((booking: any) => booking.settings_id === setting.id);
      setBookedSlots(settingBookings);
    }
  };

  const handleResetChangeForm = () => {
    setExistingBooking(null);
    setChangeCarId(null);
    setChangeEmail("");
    setSelectedNewSlot(null);
    setChangeStatus(null);
  };

  return (
    <div className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Car number</span>
            <select
              value={carId ?? ""}
              onChange={(event) => setCarId(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
            >
              {cars.length === 0 ? (
                <option value="">No active cars available</option>
              ) : (
                cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.number} — {car.university}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              placeholder="you@example.com"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="inline-flex w-fit rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Booking…" : "Confirm booking"}
        </button>

        {status ? (
          <p className={`text-sm ${status.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{status.message}</p>
        ) : (
          <p className="text-sm text-slate-600">Enter your car number, email, and choose one slot.</p>
        )}
      </form>

      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">Available slots</h2>
        {slots.length === 0 ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">No slots available for this setting.</div>
        ) : (
          slots.map((slot, index) => {
            const booked = isSlotBooked(slot);
            return (
              <button
                key={index}
                type="button"
                onClick={() => !booked && setSelectedSlot(index)}
                disabled={booked}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  booked
                    ? "border-red-300 bg-red-50 text-red-600 cursor-not-allowed opacity-60"
                    : selectedSlot === index
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">{formatSlot(slot.start, slot.end)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    booked
                      ? "bg-red-200 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {booked ? "Booked" : `Slot ${index + 1}`}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Change Booking</h2>
          <button
            type="button"
            onClick={() => (showChangeForm ? handleResetChangeForm() : setShowChangeForm(true))}
            className="text-sm text-slate-600 hover:text-slate-900 underline"
          >
            {showChangeForm ? "Cancel" : "Switch to change"}
          </button>
        </div>

        {showChangeForm && (
          <div className="space-y-4">
            {!existingBooking ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Car number</span>
                    <select
                      value={changeCarId ?? ""}
                      onChange={(event) => setChangeCarId(Number(event.target.value))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                    >
                      {cars.length === 0 ? (
                        <option value="">No active cars available</option>
                      ) : (
                        <>
                          <option value="">Select a car</option>
                          {cars.map((car) => (
                            <option key={car.id} value={car.id}>
                              {car.number} — {car.university}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Email address</span>
                    <input
                      type="email"
                      value={changeEmail}
                      onChange={(event) => setChangeEmail(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleLookupBooking}
                  disabled={isLookingUp}
                  className="inline-flex w-fit rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isLookingUp ? "Looking up…" : "Find my booking"}
                </button>

                {changeStatus ? (
                  <p className={`text-sm ${changeStatus.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
                    {changeStatus.message}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">Select a car and enter your email to find your booking</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-slate-600">Current booking:</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formatSlot(new Date(existingBooking.start_at), new Date(existingBooking.end_at))}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-900">Select new slot:</h3>
                  {slots.map((slot, index) => {
                    const booked = isSlotBooked(slot);
                    const isCurrentSlot = existingBooking.start_at === slot.start.toISOString();
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => !booked && !isCurrentSlot && setSelectedNewSlot(index)}
                        disabled={booked || isCurrentSlot}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          isCurrentSlot
                            ? "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed opacity-50"
                            : booked
                              ? "border-red-300 bg-red-50 text-red-600 cursor-not-allowed opacity-60"
                              : selectedNewSlot === index
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium">{formatSlot(slot.start, slot.end)}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            isCurrentSlot
                              ? "bg-slate-200 text-slate-600"
                              : booked
                                ? "bg-red-200 text-red-700"
                                : "bg-slate-100 text-slate-600"
                          }`}>
                            {isCurrentSlot ? "Current" : booked ? "Booked" : `Slot ${index + 1}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleChangeBooking}
                    disabled={selectedNewSlot === null || isChangingBooking}
                    className="inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isChangingBooking ? "Changing…" : "Confirm change"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetChangeForm}
                    className="inline-flex rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>

                {changeStatus ? (
                  <p className={`text-sm ${changeStatus.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
                    {changeStatus.message}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


