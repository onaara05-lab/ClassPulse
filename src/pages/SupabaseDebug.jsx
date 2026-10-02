import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function SupabaseDebug() {
  const [log, setLog] = useState([]);
  const append = (entry) => setLog((l) => [...l, entry]);

  const runChecks = async () => {
    append({ type: "info", text: "Running Supabase checks..." });

    try {
      const userRes = await supabase.auth.getUser();
      console.debug("[SupabaseDebug] auth.getUser():", userRes);
      append({ type: "result", text: JSON.stringify(userRes, null, 2) });
    } catch (e) {
      console.error("[SupabaseDebug] auth.getUser() error", e);
      append({ type: "error", text: `auth.getUser error: ${e.message || e}` });
    }

    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, course_code, course_name")
        .limit(3);

      console.debug("[SupabaseDebug] courses query:", { data, error });
      if (error) {
        append({
          type: "error",
          text: `courses query error: ${error.message}`,
        });
      } else {
        append({ type: "result", text: JSON.stringify(data, null, 2) });
      }
    } catch (e) {
      console.error("[SupabaseDebug] courses query exception", e);
      append({
        type: "error",
        text: `courses query exception: ${e.message || e}`,
      });
    }
  };

  useEffect(() => {
    // Run once on mount. Defer the call to avoid synchronous setState inside
    // the effect which can trigger cascading renders.
    const timeoutId = window.setTimeout(() => {
      runChecks();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug</h1>
      <p className="mb-4 text-sm text-text-secondary">
        This page runs quick Supabase checks: `auth.getUser()` and a small
        `courses` query. Check the results below and the browser console.
      </p>

      <div className="mb-4">
        <button
          onClick={runChecks}
          className="rounded bg-primary px-4 py-2 text-white"
        >
          Run checks
        </button>
      </div>

      <div className="space-y-2">
        {log.map((entry, idx) => (
          <pre
            key={idx}
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            className={`p-3 rounded border ${
              entry.type === "error" ? "bg-red-50 text-red-700" : "bg-surface"
            }`}
          >
            {entry.text}
          </pre>
        ))}
      </div>
    </div>
  );
}
