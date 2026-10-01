import { createClient } from "@supabase/supabase-js";

const rawUrl =
  import.meta.env?.VITE_SUPABASE_URL ??
  "https://jguowqpqionqnmabqlea.supabase.co";
const rawKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndW93cXBxaW9ucW5tYWJxbGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDA2NTMsImV4cCI6MjEwNTIxNjY1M30.St8DKyQRmzdDbHlbJbH_giywkJMFp5mn6xSRoCd6vQ8";

const supabaseUrl = String(rawUrl).trim();
const supabaseAnonKey = String(rawKey).trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase config: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY",
  );
}

function makeClient() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Failed to create Supabase client:", e);
    return null;
  }
}

const globalKey = "__SUPABASE_CLIENT__";
if (!globalThis[globalKey]) globalThis[globalKey] = makeClient();
export const supabase =
  globalThis[globalKey] ?? createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
