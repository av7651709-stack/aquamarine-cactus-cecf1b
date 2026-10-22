import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authFetch, useSession } from "../lib/supabase";

type M = Record<string, any>;
type F = { id?: string; slug: string; title: string; synopsis: string; release_year: string; language: string; category: string; genres: string; cast: string; director: string; poster_url: string; backdrop_url: string; trailer_url: string; links: string; download_url: string; license_status: string; license_note: string; featured: boolean; published: boolean };
const blank: F = { slug: "", title: "", synopsis: "", release_year: "", language: "English", category: "hollywood", genres: "", cast: "", director: "", poster_url: "", backdrop_url: "", trailer_url: "", links: "", download_url: "", license_status: "copyrighted", license_note: "", featured: false, published: false };
const list = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toForm = (m: M): F => ({ id: m.id, slug: m.slug, title: m.title, synopsis: m.synopsis ?? "", release_year: m.release_year?.toString() ?? "", language: m.language, category: m.category, genres: m.genres.join(", "), cast: m.cast_members.join(", "), director: m.director ?? "", poster_url: m.poster_url ?? "", backdrop_url: m.backdrop_url ?? "", trailer_url: m.trailer_url ?? "", links: (m.streaming_links ?? []).map((l: any) => `${l.name}|${l.url}`).join("\n"), download_url: m.download_url ?? "", license_status: m.license_status, license_note: m.license_note ?? "", featured: m.featured, published: m.published });
const toPayload = (f: F) => ({
  slug: f.slug || slugify(f.title), title: f.title, synopsis: f.synopsis || null, release_year: f.release_year ? Number(f.release_year) : null,
  language: f.language, category: f.category, genres: list(f.genres), cast_members: list(f.cast), director: f.director || null,
  poster_url: f.poster_url || null, backdrop_url: f.backdrop_url || null, trailer_url: f.trailer_url || null, download_url: f.download_url || null,
  streaming_links: f.links.split("\n").map(l => l.trim()).filter(Boolean).map(l => { const [name, ...u] = l.split("|"); return { name: name.trim(), url: u.join("|").trim() }; }),
  license_status: f.license_status, license_note: f.license_note || null, featured: f.featured, published: f.published,
});

export default function Admin() {
  const { session, ready } = useSession();
  const [movies, setMovies] = useState<M[] | null>(null);
  const [form, setForm] = useState<F | null>(null);
  const [err, setErr] = useState(""); const [denied, setDenied] = useState(false);
  const load = useCallback(() => authFetch("/api/admin/movies").then(d => setMovies(d.movies)).catch(e => e.status === 401 ? setDenied(true) : setErr(e.message)), []);
  useEffect(() => { if (session) load(); }, [session, load]);

  if (!ready) return <main className="wrap"><div className="spin" /></main>;
  if (!session) return <Navigate to="/login?next=/admin" />;
  if (denied) return <main className="wrap narrow glass pad"><h1>Not authorized</h1><p>This account is not an administrator. Add it to the <code>admins</code> table in Supabase (see setup notes).</p></main>;

  const run = async (fn: () => Promise<unknown>) => { setErr(""); try { await fn(); await load(); } catch (e: any) { setErr(e.issues ? JSON.stringify(e.issues.fieldErrors ?? e.issues) : e.message); } };
  const save = (e: FormEvent) => { e.preventDefault(); run(async () => { await authFetch(form!.id ? `/api/admin/movies?id=${form!.id}` : "/api/admin/movies", { method: form!.id ? "PUT" : "POST", body: JSON.stringify(toPayload(form!)) }); setForm(null); }); };
  const flip = (m: M, k: "featured" | "published") => run(() => authFetch(`/api/admin/movies?id=${m.id}`, { method: "PUT", body: JSON.stringify(toPayload({ ...toForm(m), [k]: !m[k] })) }));
  const del = (m: M) => confirm(`Delete "${m.title}"?`) && run(() => authFetch(`/api/admin/movies?id=${m.id}`, { method: "DELETE" }));
  const up = (k: keyof F) => (e: any) => setForm({ ...form!, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  if (form) return (
    <main className="wrap narrow"><form className="glass pad stack" onSubmit={save}>
      <h1>{form.id ? "Edit" : "Add"} movie</h1>
      <input required placeholder="Title" value={form.title} onChange={up("title")} />
      <input placeholder="Slug (auto from title)" value={form.slug} onChange={up("slug")} />
      <textarea rows={4} placeholder="Synopsis" value={form.synopsis} onChange={up("synopsis")} />
      <input placeholder="Release year" inputMode="numeric" value={form.release_year} onChange={up("release_year")} />
      <input required placeholder="Language" value={form.language} onChange={up("language")} />
      <select value={form.category} onChange={up("category")}>{["bollywood", "south-dubbed-hindi", "hollywood", "web-series", "animation", "family"].map(c => <option key={c}>{c}</option>)}</select>
      <input placeholder="Genres (comma separated)" value={form.genres} onChange={up("genres")} />
      <input placeholder="Cast (comma separated)" value={form.cast} onChange={up("cast")} />
      <input placeholder="Director" value={form.director} onChange={up("director")} />
      <input placeholder="Poster image URL (https)" value={form.poster_url} onChange={up("poster_url")} />
      <input placeholder="Backdrop image URL (https)" value={form.backdrop_url} onChange={up("backdrop_url")} />
      <input placeholder="Trailer URL (YouTube, https)" value={form.trailer_url} onChange={up("trailer_url")} />
      <textarea rows={3} placeholder={"Official streaming links, one per line:\nName|https://official-link"} value={form.links} onChange={up("links")} />
      <select value={form.license_status} onChange={up("license_status")}><option value="copyrighted">copyrighted (no downloads)</option><option value="public_domain">public_domain</option><option value="permission_granted">permission_granted</option></select>
      <input placeholder="Authorized download URL (only if licensed above)" value={form.download_url} onChange={up("download_url")} />
      <input placeholder="License note / proof of permission" value={form.license_note} onChange={up("license_note")} />
      <label><input type="checkbox" checked={form.featured} onChange={up("featured")} /> Featured on homepage</label>
      <label><input type="checkbox" checked={form.published} onChange={up("published")} /> Published</label>
      {err && <p className="err">{err}</p>}
      <div className="row"><button className="btn">Save</button><button type="button" className="btn alt" onClick={() => { setForm(null); setErr(""); }}>Cancel</button></div>
    </form></main>);

  return (
    <main className="wrap">
      <div className="row between"><h1>Admin dashboard</h1><button className="btn" onClick={() => setForm({ ...blank })}>+ Add movie</button></div>
      {err && <p className="err">{err}</p>}
      {!movies && <div className="spin" />}
      <div className="stack">{movies?.map(m => (
        <div key={m.id} className="glass pad arow">
          <div><b>{m.title}</b> <small>{m.release_year} · {m.category}</small></div>
          <div className="row">
            <button className={`chip ${m.published ? "on" : ""}`} onClick={() => flip(m, "published")}>{m.published ? "Published" : "Draft"}</button>
            <button className={`chip ${m.featured ? "on" : ""}`} onClick={() => flip(m, "featured")}>{m.featured ? "★ Featured" : "☆ Feature"}</button>
            <button className="chip" onClick={() => setForm(toForm(m))}>Edit</button>
            <button className="chip danger" onClick={() => del(m)}>Delete</button>
          </div>
        </div>))}</div>
    </main>
  );
}
