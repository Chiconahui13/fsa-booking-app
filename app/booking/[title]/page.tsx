import { notFound } from "next/navigation";
import Link from "next/link";
import BookingSlotForm from "./BookingSlotForm";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

const formatAvailability = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleString()} — ${endDate.toLocaleString()}`;
};

type Slot = {
  start: Date;
  end: Date;
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

export async function generateStaticParams() {
  const { data, error } = await supabaseAdmin.from<Setting>("settings").select("title").eq("is_active", true);
  if (error || !data) return [];
  return data.map((setting) => ({ title: setting.title }));
}

export default async function BookingSettingPage({ params }: { params: Promise<{ title: string }> }) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  const { data, error } = await supabaseAdmin
    .from<Setting>("settings")
    .select("*")
    .eq("title", decodedTitle)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">{data.title}</h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Booking details for this active setting.
            </p>
          </div>
          <Link href="/booking" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
            Back to bookings
          </Link>
        </div>

        <div className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Slot length</h2>
              <p className="mt-2 text-lg font-semibold text-slate-900">{data.slot_length} minutes</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Interval</h2>
              <p className="mt-2 text-lg font-semibold text-slate-900">{data.slot_intervall} minutes</p>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Availability</h2>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatAvailability(data.availability_start, data.availability_end)}</p>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <BookingSlotForm setting={data} />
        </div>
      </div>
    </div>
  );
}
