import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  let query = supabaseAdmin.from("settings").select("*").order("id", { ascending: false });

  // Public users should only see active settings; authenticated users can see all.
  if (!user) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();

  const required = [
    "title",
    "slot_length",
    "slot_intervall",
    "notification_email",
    "availability_start",
    "availability_end",
  ];

  for (const key of required) {
    if (!payload[key]) {
      return NextResponse.json(
        { error: `${key} is required` },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin.from("settings").insert([
    {
      title: payload.title,
      slot_length: payload.slot_length,
      slot_intervall: payload.slot_intervall,
      notification_email: payload.notification_email,
      slack_webhook: payload.slack_webhook || null,
      is_active: payload.is_active ?? true,
      availability_start: payload.availability_start,
      availability_end: payload.availability_end,
    },
  ]).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null, { status: 201 });
}
