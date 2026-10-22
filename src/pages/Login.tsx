import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, configured } from "../lib/supabase";

export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const nav = useNavigate(); const next = useSearchParams()[0].get("next") || "/";
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const { data, error } = mode === "in" ? await supabase.auth.signInWithPassword({ email, password: pw }) : await supabase.auth.signUp({ email, password: pw });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (data.session) nav(next.startsWith("/") ? next : "/"); else setMsg("Check your email to confirm your account, then log in.");
  }
  return (
    <main className="wrap narrow">
      <form className="glass pad stack" onSubmit={submit}>
        <h1>{mode === "in" ? "Log in" : "Create account"}</h1>
        {!configured && <p className="err">Supabase is not configured (see .env.example).</p>}
        <input type="email" placeholder="Email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password (min 8)" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} value={pw} onChange={e => setPw(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Log in" : "Sign up"}</button>
        {msg && <p className="err">{msg}</p>}
        <button type="button" className="link" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "New here? Create account" : "Have an account? Log in"}</button>
        <small>Admin access is granted separately in the database; signing up never makes you an admin.</small>
      </form>
    </main>
  );
}
