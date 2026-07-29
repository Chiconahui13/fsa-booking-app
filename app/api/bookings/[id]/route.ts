import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/googleCalendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookingId = Number(id);
  if (Number.isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const payload = await request.json();
  const required = ["user_email", "car_id", "start_at", "end_at"];
  for (const key of required) {
    if (!payload[key]) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const { data: existingBooking, error: fetchError } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (fetchError || !existingBooking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const { data: conflict } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("start_at", payload.start_at)
    .neq("id", bookingId)
    .single();

  if (conflict) {
    return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
  }

  const { data: carConflict } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("settings_id", existingBooking.settings_id)
    .eq("car_id", payload.car_id)
    .neq("id", bookingId)
    .single();

  if (carConflict) {
    return NextResponse.json({ error: "This car already has a booking for this setting." }, { status: 409 });
  }

  const { data: car, error: carFetchError } = await supabaseAdmin
    .from("cars")
    .select("number, university")
    .eq("id", payload.car_id)
    .single();

  if (carFetchError || !car) {
    return NextResponse.json({ error: carFetchError?.message ?? "Car not found" }, { status: 400 });
  }

  if (existingBooking.google_event_id) {
    await updateCalendarEvent({
      eventId: existingBooking.google_event_id,
      summary: `${car.number} ${car.university} ${payload.user_email}`,
      description: `Booking for ${payload.user_email} (${car.number})`,
      start: payload.start_at,
      end: payload.end_at,
    });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("bookings")
    .update({
      user_email: payload.user_email,
      car_id: payload.car_id,
      start_at: payload.start_at,
      end_at: payload.end_at,
      status: payload.status ?? existingBooking.status,
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookingId = Number(id);
  if (Number.isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const { data: booking, error: fetchError } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.google_event_id) {
    await deleteCalendarEvent(booking.google_event_id);
  }

  const { error: deleteError } = await supabaseAdmin
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
