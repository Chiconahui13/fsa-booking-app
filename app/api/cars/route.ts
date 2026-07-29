import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("cars")
    .select("id, number, university, is_active")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cars = (data ?? []).sort((a, b) => {
    const parseCarNumber = (value: string) => {
      const plainMatch = value.match(/^(\d+)$/);
      if (plainMatch) {
        return { type: "plain", value: Number(plainMatch[1]) };
      }
      const eMatch = value.match(/^E(\d+)$/i);
      if (eMatch) {
        return { type: "e", value: Number(eMatch[1]) };
      }
      return { type: "other", value: value };
    };

    const parsedA = parseCarNumber(a.number);
    const parsedB = parseCarNumber(b.number);

    if (parsedA.type !== parsedB.type) {
      if (parsedA.type === "plain") return -1;
      if (parsedB.type === "plain") return 1;
      if (parsedA.type === "e") return -1;
      if (parsedB.type === "e") return 1;
    }

    if (parsedA.type === "plain" || parsedA.type === "e") {
      return (parsedA.value as number) - (parsedB.value as number);
    }

    return String(parsedA.value).localeCompare(String(parsedB.value));
  });

  return NextResponse.json(cars);
}
