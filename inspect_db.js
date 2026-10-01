import { createClient } from "@supabase/supabase-js";

const url = "https://jguowqpqionqnmabqlea.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndW93cXBxaW9ucW5tYWJxbGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDA2NTMsImV4cCI6MjEwNTIxNjY1M30.St8DKyQRmzdDbHlbJbH_giywkJMFp5mn6xSRoCd6vQ8";

const supabase = createClient(url, key);

async function inspect() {
  const { data: courses, error: cErr } = await supabase.from("courses").select("*");
  console.log("COURSES:", courses?.length, cErr);

  const { data: sessions, error: sErr } = await supabase.from("class_sessions").select("*");
  console.log("CLASS_SESSIONS:", sessions?.length, sErr);

  const { data: attendance, error: aErr } = await supabase.from("attendance_records").select("*");
  console.log("ATTENDANCE_RECORDS:", attendance?.length, aErr);

  const { data: enrollments, error: eErr } = await supabase.from("enrollments").select("*");
  console.log("ENROLLMENTS:", enrollments?.length, eErr);

  const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
  console.log("PROFILES:", profiles?.length, pErr);
}

inspect();
