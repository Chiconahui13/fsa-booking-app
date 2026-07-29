"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: number;
  user_email: string;
  car_id: number;
  car_number: string;
  start_at: string;
  end_at: string;
  google_event_id: string | null;
  status: string;
};

type FormState = {
  user_email: string;
  car_id: number | null;
  start_at: string;
  end_at: string;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [formState, setFormState] = useState<FormState>({
    user_email: "",
    car_id: null,
    start_at: "",
    end_at: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const response = await fetch("/api/bookings");
    if (!response.ok) return;
    const data = await response.json();
    setBookings(data);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/bookings/${editingId}` : "/api/bookings";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const result = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setMessage(result.error || "Failed to save booking.");
      return;
    }

    setMessage(editingId ? "Booking updated." : "Booking added.");
    setEditingId(null);
    setFormState({ user_email: "", car_number: "", start_at: "", end_at: "" });
    loadBookings();
  };

  const handleEdit = (booking: Booking) => {
    setEditingId(booking.id);
    setFormState({
      user_email: booking.user_email,
      car_number: booking.car_number,
      start_at: booking.start_at.slice(0, 16),
      end_at: booking.end_at.slice(0, 16),
    });
  };

  const handleDelete = async (id: number) => {
    const response = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error || "Failed to delete booking.");
      return;
    }
    setMessage("Booking deleted.");
    loadBookings();
  };

  const formatLocal = useMemo(
    () => (dateString: string) => new Date(dateString).toLocaleString(),
    []
  );

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Bookings</h1>
            <p className="mt-2 text-slate-600">View, add, edit, and delete bookings.</p>
          </div>
        </div>

        <form className="mt-10 grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={formState.user_email}
              onChange={(event) => handleChange("user_email", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">ID</span>
            <input
              type="text"
              value={formState.car_number}
              onChange={(event) => handleChange("car_number", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Start</span>
            <input
              type="datetime-local"
              value={formState.start_at}
              onChange={(event) => handleChange("start_at", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">End</span>
            <input
              type="datetime-local"
              value={formState.end_at}
              onChange={(event) => handleChange("end_at", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <div className="md:col-span-2 flex flex-col gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : editingId ? "Update booking" : "Add booking"}
            </button>
            {message ? <p className="text-sm text-slate-700">{message}</p> : null}
          </div>
        </form>

        <div className="mt-12 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                <th className="px-4 py-3 font-medium text-slate-700">ID</th>
                <th className="px-4 py-3 font-medium text-slate-700">Start</th>
                <th className="px-4 py-3 font-medium text-slate-700">End</th>
                <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-4 text-slate-700">{booking.user_email}</td>
                  <td className="px-4 py-4 text-slate-700">{booking.car_number}</td>
                  <td className="px-4 py-4 text-slate-700">{formatLocal(booking.start_at)}</td>
                  <td className="px-4 py-4 text-slate-700">{formatLocal(booking.end_at)}</td>
                  <td className="px-4 py-4 text-slate-700">{booking.status}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(booking)}
                        className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(booking.id)}
                        className="rounded-2xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
