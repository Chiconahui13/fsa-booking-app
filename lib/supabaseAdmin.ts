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

const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseServiceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for admin client");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});
