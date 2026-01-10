#!/usr/bin/env node
// CommonJS version of scripts/create_admins.js for projects using "type": "module".
// Usage:
// 1. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env
// 2. npm install dotenv (if not installed)
// 3. node scripts/create_admins.cjs

const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Set them (or add to a .env) then re-run the script.');
  process.exit(1);
}

const admins = ['admin1','admin2','admin3','admin4','admin5'];

async function createUser(username) {
  const email = `${username}@v-vortex.in`;
  const password = `${username}231225`;

  const url = SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/admin/users';

  const body = {
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: username },
    app_metadata: { role: 'admin' }
  };

  // Use global fetch if available (Node 18+), otherwise try node-fetch
  const fetchFn = (typeof fetch !== 'undefined') ? fetch : require('node-fetch');

  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY
    },
    body: JSON.stringify(body)
  });

  let data;
  try { data = await res.json(); } catch(e){ data = null; }

  if (res.ok) {
    console.log(`Created ${username} -> ${email}  password: ${password}`);
    return { ok: true, user: data };
  } else {
    console.error(`Failed to create ${username}:`, data || res.statusText);
    return { ok: false, error: data };
  }
}

async function main(){
  console.log('Creating admin users...');
  for (const name of admins) {
    // eslint-disable-next-line no-await-in-loop
    await createUser(name);
  }
  console.log('Done. Verify users in Supabase Auth dashboard.');
}

main().catch(err=>{ console.error(err); process.exit(1); });
