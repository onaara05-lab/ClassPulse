import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env?.VITE_SUPABASE_URL ?? "";
const rawKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? "";

const supabaseUrl = String(rawUrl).trim();
const supabaseAnonKey = String(rawKey).trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase config: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

function makeClient() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    new URL(supabaseUrl);
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Failed to create Supabase client:", e);
    return null;
  }
}

const globalKey = "__SUPABASE_CLIENT__";
if (!globalThis[globalKey]) globalThis[globalKey] = makeClient();
export const supabase = globalThis[globalKey] ?? null;