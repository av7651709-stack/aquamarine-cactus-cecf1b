import { createClient } from "@supabase/supabase-js";
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });
const clean = (v: string | null) => (v ?? "").replace(/[%,()*\\]/g, "").trim().slice(0, 80);
const CARD = "id,slug,title,release_year,language,category,genres,poster_url,backdrop_url,featured";

export default async (req: Request) => {
  try {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const p = new URL(req.url).searchParams, db = sb();
    const slug = clean(p.get("slug"));
    if (slug) {
      const { data, error } = await db.from("movies").select("*").eq("slug", slug).eq("published", true).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Not found" }, 404);
      const { data: similar } = await db.from("movies").select(CARD).eq("published", true)
        .neq("id", data.id).overlaps("genres", data.genres.length ? data.genres : ["__none__"]).limit(8);
      return json({ movie: data, similar: similar ?? [] });
    }
    const page = Math.max(1, parseInt(p.get("page") ?? "1") || 1), size = 24;
    let q = db.from("movies").select(CARD, { count: "exact" }).eq("published", true);
    const lang = clean(p.get("language")), cat = clean(p.get("category")), genre = clean(p.get("genre")), text = clean(p.get("q"));
    const year = parseInt(p.get("year") ?? "");
    if (lang) q = q.ilike("language", `%${lang}%`);
    if (cat) q = q.eq("category", cat);
    if (genre) q = q.contains("genres", [genre]);
    if (year) q = q.eq("release_year", year);
    if (text) q = q.ilike("title", `%${text}%`);
    if (p.get("featured") === "1") q = q.eq("featured", true);
    const { data, count, error } = await q.order("created_at", { ascending: false }).range((page - 1) * size, page * size - 1);
    if (error) throw error;
    return json({ movies: data, total: count ?? 0, page, pages: Math.ceil((count ?? 0) / size) });
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
};
export const config = { path: "/api/movies" };
