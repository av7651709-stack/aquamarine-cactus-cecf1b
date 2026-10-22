import { createClient, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const configured = !!url && !!key;
// Placeholders keep the public pages working when Supabase isn't configured yet.
export const supabase = createClient(url || "http://localhost", key || "missing-key");

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const r = await fetch(path, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}`, ...(init.headers as object) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error ?? "Request failed"), { status: r.status, issues: j.issues });
  return j;
}
