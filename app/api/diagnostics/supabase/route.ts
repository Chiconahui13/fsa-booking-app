import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeEnv(value: string | undefined) {
  if (!value) return value;
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function safeMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET() {
  const url = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL);
  const anonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY);
  const serviceKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY);

  const result: Record<string, unknown> = {
    env: {
      urlPresent: Boolean(url),
      anonKeyPresent: Boolean(anonKey),
      serviceKeyPresent: Boolean(serviceKey),
      urlHost: url ? new URL(url).host : null,
    },
  };

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        ...result,
        error: "Missing one or more Supabase environment variables in runtime.",
      },
      { status: 500 }
    );
  }

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });

    const tables = ["settings", "bookings", "cars", "users"] as const;

    const adminChecks = await Promise.all(
      tables.map(async (table) => {
        const { error } = await admin.from(table).select("id", { count: "exact", head: true });
        return [table, error] as const;
      })
    );

    const anonChecks = await Promise.all(
      tables.map(async (table) => {
        const { error } = await anon.from(table).select("id", { count: "exact", head: true });
        return [table, error] as const;
      })
    );

    const formatError = (error: { message?: string; code?: string | null; details?: string | null; hint?: string | null } | null) =>
      error
        ? {
            ok: false,
            message: error.message ?? "",
            code: error.code ?? null,
            details: error.details ?? null,
            hint: error.hint ?? null,
          }
        : { ok: true };

    const adminResult = Object.fromEntries(adminChecks.map(([table, error]) => [table, formatError(error)]));
    const anonResult = Object.fromEntries(anonChecks.map(([table, error]) => [table, formatError(error)]));

    const adminOk = adminChecks.every(([, error]) => !error);

    return NextResponse.json({
      ok: adminOk,
      ...result,
      admin: adminResult,
      anon: anonResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...result,
        error: safeMessage(error),
      },
      { status: 500 }
    );
  }
}
