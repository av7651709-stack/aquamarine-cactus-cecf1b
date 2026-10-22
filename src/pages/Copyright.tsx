import { FormEvent, useState } from "react";
export default function Copyright() {
  const [f, setF] = useState({ name: "", email: "", work_title: "", url: "", details: "", website: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle"); const [err, setErr] = useState("");
  const up = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  async function submit(e: FormEvent) {
    e.preventDefault(); setState("busy"); setErr("");
    const r = await fetch("/api/complaints", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) }).catch(() => null);
    if (r?.ok) return setState("done");
    const j = await r?.json().catch(() => ({})); setState("idle");
    setErr(j?.issues ? "Please complete all fields (details need 20+ characters)." : j?.error ?? "Could not send. Try again.");
  }
  if (state === "done") return <main className="wrap narrow glass pad"><h1>Thank you</h1><p>Your complaint was received and will be reviewed.</p></main>;
  return (
    <main className="wrap narrow"><form className="glass pad stack" onSubmit={submit}>
      <h1>Copyright complaint</h1>
      <input required placeholder="Your name" value={f.name} onChange={up("name")} />
      <input required type="email" placeholder="Your email" value={f.email} onChange={up("email")} />
      <input required placeholder="Title of the copyrighted work" value={f.work_title} onChange={up("work_title")} />
      <input type="url" placeholder="URL of the page on this site (optional)" value={f.url} onChange={up("url")} />
      <textarea required rows={5} minLength={20} placeholder="Describe the issue and your rights to the work" value={f.details} onChange={up("details")} />
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" placeholder="Leave empty" value={f.website} onChange={up("website")} />
      {err && <p className="err">{err}</p>}
      <button className="btn" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Submit complaint"}</button>
    </form></main>
  );
}
