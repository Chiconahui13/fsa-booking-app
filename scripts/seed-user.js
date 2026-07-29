const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const args = process.argv.slice(2);
  const opts = args.reduce((acc, arg, index) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      if (value !== undefined) {
        acc[key] = value;
      } else {
        const nextArg = args[index + 1];
        if (nextArg && !nextArg.startsWith("--")) {
          acc[key] = nextArg;
        }
      }
    }
    return acc;
  }, {});

  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local file");
  }

  const env = parseEnv(fs.readFileSync(envPath, "utf8"));
  const email = opts.email || process.env.SEED_USER_EMAIL;
  const password = opts.password || process.env.SEED_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("Provide --email and --password to seed a user.");
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  if (existing) {
    console.log(`User already exists: ${existing.email}`);
    return;
  }

  const password_hash = hashPassword(password);
  const { data, error } = await supabase
    .from("users")
    .insert([{ email, password_hash }])
    .select("id, email")
    .single();

  if (error) {
    if (error.message && error.message.toLowerCase().includes("permission denied")) {
      throw new Error(
        "Permission denied for table users. Ensure the service_role has grants on public.users. " +
          "Run the SQL in supabase/migrations/0005_grant_users_permissions.sql or apply the grant manually."
      );
    }
    throw error;
  }

  console.log("Seed user created:", data);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
