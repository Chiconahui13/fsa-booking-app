const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf8');
const env = envText.split(/\r?\n/).reduce((acc, line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) {
    let [, key, value] = m;
    key = key.trim();
    value = value.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    acc[key] = value;
  }
  return acc;
}, {});
console.log('NEXT_PUBLIC_SUPABASE_URL', env.NEXT_PUBLIC_SUPABASE_URL ? 'loaded' : 'missing');
console.log('ANON KEY', env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'loaded' : 'missing');
console.log('SERVICE ROLE KEY', env.SUPABASE_SERVICE_ROLE_KEY ? 'loaded' : 'missing');

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars');
  process.exit(1);
}

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await supabaseAdmin.from('settings').select('*').limit(1).single();
  console.log('error', error);
  console.log('data', data);
})();
