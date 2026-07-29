import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { sendEmailNotification, sendSlackNotification } from "@/lib/notifications";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("bookings").select("*").order("id", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const required = ["user_email", "car_id", "start_at", "end_at", "settings_id"];
  for (const key of required) {
    if (!payload[key]) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("id", payload.settings_id)
    .single();

  if (settingsError || !settings) {
    return NextResponse.json({ error: settingsError?.message ?? "Settings not found" }, { status: 400 });
  }

  const { data: car, error: carError } = await supabaseAdmin
    .from("cars")
    .select("*")
    .eq("id", payload.car_id)
    .eq("is_active", true)
    .single();

  if (carError || !car) {
    return NextResponse.json({ error: carError?.message ?? "Car not found or inactive" }, { status: 400 });
  }

  const { data: existingSlot } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("settings_id", payload.settings_id)
    .eq("start_at", payload.start_at)
    .single();

  if (existingSlot) {
    return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
  }

  const { data: existingCarBooking } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("settings_id", payload.settings_id)
    .eq("car_id", payload.car_id)
    .single();

  if (existingCarBooking) {
    return NextResponse.json({ error: "This car already has a booking for this setting." }, { status: 409 });
  }

  const eventId = await createCalendarEvent({
    summary: `${car.number} ${car.university} ${payload.user_email}`,
    description: `Booking for ${payload.user_email} (${car.number})`,
    start: payload.start_at,
    end: payload.end_at,
  });

  const { data: booking, error: bookingError } = await supabaseAdmin.from("bookings").insert([
    {
      user_email: payload.user_email,
      car_id: payload.car_id,
      car_number: car.number,
      start_at: payload.start_at,
      end_at: payload.end_at,
      google_event_id: eventId,
      settings_id: settings.id,
      status: "confirmed",
    },
  ]);

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  const notificationText = `New booking for ${payload.user_email} from ${payload.start_at} to ${payload.end_at}.`;
  await Promise.all([
    sendEmailNotification({
      to: payload.user_email,
      subject: "Booking confirmed",
      body: notificationText,
    }),
    sendEmailNotification({
      to: settings.notification_email,
      subject: "New booking received",
      body: notificationText,
    }),
    settings.slack_webhook
      ? sendSlackNotification({
          webhookUrl: settings.slack_webhook,
          message: notificationText,
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json(booking?.[0] ?? null, { status: 201 });
}
