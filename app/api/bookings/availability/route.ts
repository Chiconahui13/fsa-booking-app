import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { addMinutes, formatISO, parseISO } from "date-fns";

export async function GET() {
  const { data: settings, error } = await supabaseAdmin
    .from("settings")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error || !settings) {
    return NextResponse.json({ error: error?.message ?? "No settings found" }, { status: 500 });
  }

  const start = parseISO(settings.availability_start);
  const end = parseISO(settings.availability_end);
  const slots = [] as Array<{ start: string; end: string }>;
  let current = start;

  while (current < end) {
    const slotEnd = addMinutes(current, settings.slot_length);
    if (slotEnd > end) break;

    slots.push({
      start: formatISO(current),
      end: formatISO(slotEnd),
    });

    current = addMinutes(current, settings.slot_intervall);
  }

  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("start_at")
    .gte("start_at", settings.availability_start)
    .lte("start_at", settings.availability_end);

  const reserved = new Set((bookings ?? []).map((booking) => booking.start_at));
  const available = slots.filter((slot) => !reserved.has(slot.start));

  return NextResponse.json({ available });
}
