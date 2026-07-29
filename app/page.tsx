"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/70">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-semibold">FSA Bookings</h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600">
            
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/booking"
            className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-10 text-left transition hover:border-slate-300 hover:bg-slate-100"
          >
            <p className="text-sm font-semibold text-slate-900">Public booking interface</p>
            <p className="mt-3 text-sm text-slate-600"></p>
          </Link>
          <Link
            href="/admin"
            className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-10 text-left transition hover:border-slate-300 hover:bg-slate-100"
          >
            <p className="text-sm font-semibold text-slate-900">Admin settings</p>
            <p className="mt-3 text-sm text-slate-600">Manage booking configuration and notifications.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
