import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually since we don't have dotenv loaded by default in node
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key length:', supabaseAnonKey?.length);
console.log('Service Key length:', supabaseServiceKey?.length);

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('\n--- 1. Testing Cases select with Anon/User permissions ---');
  const { data: casesData, error: casesError } = await supabase
    .from('cases')
    .select('*')
    .limit(1);
  
  if (casesError) {
    console.error('Anon Client select from "cases" error:', casesError);
  } else {
    console.log('Anon Client select from "cases" success. Data found:', casesData);
  }

  console.log('\n--- 2. Testing Cases select with Admin/Service Role permissions ---');
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('cases')
    .select('*')
    .limit(1);

  if (adminError) {
    console.error('Service Client select from "cases" error:', adminError);
  } else {
    console.log('Service Client select from "cases" success. Data found:', adminData);
  }

  console.log('\n--- 3. Checking other tables structure & existence ---');
  const tables = ['cases', 'case_services', 'memorials', 'delegations'];
  for (const table of tables) {
    const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}": ERROR ->`, error.message);
    } else {
      console.log(`Table "${table}": EXISTS (Row count sampled: ${data.length})`);
    }
  }
}

checkDatabase();
