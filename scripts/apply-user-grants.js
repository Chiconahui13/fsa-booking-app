const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function parseEnv(file) {
  return file
    .split(/\r?\n/)
    .reduce((env, line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (!match) return env;
      let [, key, value] = match;
      key = key.trim();
      value = value.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
      return env;
    }, {});
}

async function main() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local file");
  }

  const env = parseEnv(fs.readFileSync(envPath, "utf8"));
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const sql = `
CREATE TABLE IF NOT EXISTS public.users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;
`;

  const { data, error } = await supabase.rpc("pg_execute_sql", { sql });
  if (error) {
    throw error;
  }

  console.log("Applied users grants successfully.");
  console.log(data);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
