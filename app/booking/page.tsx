"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Setting = {
  id: number;
  title: string;
  slot_length: number;
  slot_intervall: number;
  notification_email: string;
  slack_webhook: string | null;
  availability_start: string;
  availability_end: string;
  is_active: boolean;
};

export default function BookingPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        setSettings([]);
        setIsLoading(false);
        return;
      }

      const data: Setting[] = await response.json();
      setSettings(data.filter((setting) => setting.is_active));
      setIsLoading(false);
    }

    loadSettings();
  }, []);

  const formatAvailability = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleString()} — ${endDate.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Available bookings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Browse the currently active booking settings. Select the schedule that fits your needs.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Back home
          </Link>
        </div>

        <div className="mt-10 space-y-4">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-600">Loading active settings…</div>
          ) : settings.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
              No active settings are available right now.
            </div>
          ) : (
            settings.map((setting) => (
              <Link
                key={setting.id}
                href={`/booking/${encodeURIComponent(setting.title)}`}
                className="group block rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 group-hover:text-slate-900">{setting.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{formatAvailability(setting.availability_start, setting.availability_end)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
                    {setting.slot_length} min slot
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
