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

    const [{ error: adminError }, { error: anonError }] = await Promise.all([
      admin.from("settings").select("id", { count: "exact", head: true }),
      anon.from("settings").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      ok: !adminError,
      ...result,
      admin: adminError
        ? {
            ok: false,
            message: adminError.message,
            code: adminError.code ?? null,
            details: adminError.details ?? null,
            hint: adminError.hint ?? null,
          }
        : { ok: true },
      anon: anonError
        ? {
            ok: false,
            message: anonError.message,
            code: anonError.code ?? null,
            details: anonError.details ?? null,
            hint: anonError.hint ?? null,
          }
        : { ok: true },
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
