"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";


type Booking = {
  id: number;
  user_email: string;
  car_number: string;
  car_id: number;
  start_at: string;
  end_at: string;
  status: string;
  settings_id: number;
};

type Setting = {
  id: number;
  title: string;
};

type SortConfig = {
  key: keyof Booking;
  direction: "asc" | "desc";
};

export default function SettingBookingsPage() {
  const params = useParams();
  const settingsId = Number(params.id);

  const [setting, setSetting] = useState<Setting | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "start_at",
    direction: "desc",
  });

  useEffect(() => {
    async function loadData() {
      // Load setting
      const settingResponse = await fetch(`/api/settings/${settingsId}`);
      if (settingResponse.ok) {
        const settingData = await settingResponse.json();
        setSetting(settingData);
      }

      // Load all bookings and filter by settings_id
      const bookingsResponse = await fetch("/api/bookings");
      if (bookingsResponse.ok) {
        const allBookings: Booking[] = await bookingsResponse.json();
        const filtered = allBookings.filter((b) => b.settings_id === settingsId);
        setBookings(filtered);
      }

      setIsLoading(false);
    }

    loadData();
  }, [settingsId]);

  const sortedBookings = [...bookings].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    let comparison = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    }

    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  const handleSort = (key: keyof Booking) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ column }: { column: keyof Booking }) => {
    if (sortConfig.key !== column) {
      return <span className="text-slate-400">⇅</span>;
    }
    return sortConfig.direction === "asc" ? <span>▲</span> : <span>▼</span>;
  };

  const handleExport = () => {
    if (sortedBookings.length === 0) return;

    const exportData = sortedBookings.map((booking) => ({
      Email: booking.user_email,
      Car: booking.car_number || "—",
      "Start Time": new Date(booking.start_at).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      "End Time": new Date(booking.end_at).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      Status: booking.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    
    // Auto-size columns
    const columnWidths = [
      { wch: 30 }, // Email
      { wch: 15 }, // Car
      { wch: 20 }, // Start Time
      { wch: 20 }, // End Time
      { wch: 15 }, // Status
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, `bookings-${setting?.title || "export"}-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/70">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back to settings
              </Link>
            </div>
            <h1 className="mt-3 text-3xl font-semibold">
              {isLoading ? "Loading…" : setting?.title ? `Bookings for "${setting.title}"` : "Bookings"}
            </h1>
            <p className="mt-2 text-slate-600">
              {sortedBookings.length} booking{sortedBookings.length !== 1 ? "s" : ""}
            </p>
          </div>
          {!isLoading && sortedBookings.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              ⬇ Export to Excel
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="mt-8 text-slate-600">Loading bookings…</p>
        ) : sortedBookings.length === 0 ? (
          <p className="mt-8 text-slate-600">No bookings found for this setting.</p>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("user_email")}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
                    >
                      Email
                      <SortIcon column="user_email" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("car_number")}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
                    >
                      Car
                      <SortIcon column="car_number" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("start_at")}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
                    >
                      Start
                      <SortIcon column="start_at" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("end_at")}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
                    >
                      End
                      <SortIcon column="end_at" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
                    >
                      Status
                      <SortIcon column="status" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-4 text-slate-700">{booking.user_email}</td>
                    <td className="px-4 py-4 text-slate-700">{booking.car_number || "—"}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {new Date(booking.start_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {new Date(booking.end_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        booking.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : booking.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-700"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
