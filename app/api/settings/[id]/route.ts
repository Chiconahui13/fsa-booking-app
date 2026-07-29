import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settingId = Number(id);
  if (Number.isNaN(settingId)) {
    return NextResponse.json({ error: "Invalid setting ID" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("id", settingId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Setting not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const settingId = Number(id);
  if (Number.isNaN(settingId)) {
    return NextResponse.json({ error: "Invalid setting ID" }, { status: 400 });
  }

  const payload = await request.json();
  const { data, error } = await supabaseAdmin
    .from("settings")
    .update({
      title: payload.title,
      slot_length: payload.slot_length,
      slot_intervall: payload.slot_intervall,
      notification_email: payload.notification_email,
      slack_webhook: payload.slack_webhook || null,
      is_active: payload.is_active ?? true,
      availability_start: payload.availability_start,
      availability_end: payload.availability_end,
    })
    .eq("id", settingId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const settingId = Number(id);
  if (Number.isNaN(settingId)) {
    return NextResponse.json({ error: "Invalid setting ID" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("settings")
    .delete()
    .eq("id", settingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
