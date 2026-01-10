#!/usr/bin/env node
// Create five admin users via Supabase Admin REST API.
// Usage:
// 1. Set env vars: SUPABASE_URL (e.g. https://xyz.supabase.co) and SUPABASE_SERVICE_ROLE_KEY
// 2. node scripts/create_admins.js
// Default emails: admin1@v-vortex.in ... admin5@v-vortex.in

const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

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

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(()=>null);
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
