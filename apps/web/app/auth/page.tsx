"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Sign in successful.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Supabase is not configured yet.");
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          UNRAVEL AI
        </p>
        <h1 className="text-3xl font-bold">Sign in</h1>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none ring-0 focus:border-cyan-500"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none ring-0 focus:border-cyan-500"
            />
          </label>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
          {message ? <p className="text-sm text-slate-300">{message}</p> : null}
        </div>
      </div>
    </main>
  );
}
