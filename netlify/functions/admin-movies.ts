import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });
const https = z.string().url().refine((u) => u.startsWith("https://"), "Must be https").nullable().optional();

const Movie = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(120),
  title: z.string().min(1).max(200),
  synopsis: z.string().max(4000).nullable().optional(),
  release_year: z.number().int().min(1880).max(2100).nullable().optional(),
  language: z.string().min(1).max(60),
  category: z.enum(["bollywood", "south-dubbed-hindi", "hollywood", "web-series", "animation", "family"]),
  genres: z.array(z.string().max(40)).max(10).default([]),
  cast_members: z.array(z.string().max(80)).max(30).default([]),
  director: z.string().max(120).nullable().optional(),
  poster_url: https, backdrop_url: https, trailer_url: https, download_url: https,
  streaming_links: z.array(z.object({ name: z.string().max(60), url: z.string().url().startsWith("https://") })).max(10).default([]),
  license_status: z.enum(["copyrighted", "public_domain", "permission_granted"]).default("copyrighted"),
  license_note: z.string().max(500).nullable().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
}).refine((m) => !m.download_url || m.license_status !== "copyrighted",
  { message: "Downloads allowed only for public-domain or permission-granted content", path: ["download_url"] });

// Every request: verify Supabase JWT, then confirm the user is in `admins`.
async function requireAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) return null;
  const { data } = await db.auth.getUser(token);
  if (!data.user) return null;
  const { data: row } = await db.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return row ? data.user : null;
}

export default async (req: Request) => {
  try {
    if (!(await requireAdmin(req))) return json({ error: "Unauthorized" }, 401);
    const id = new URL(req.url).searchParams.get("id");
    if (req.method === "GET") {
      const { data, error } = await db.from("movies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json({ movies: data });
    }
    if (req.method === "DELETE") {
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await db.from("movies").delete().eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }
    if (req.method === "POST" || req.method === "PUT") {
      const parsed = Movie.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.flatten() }, 400);
      const q = req.method === "POST" ? db.from("movies").insert(parsed.data)
        : db.from("movies").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id ?? "");
      if (req.method === "PUT" && !id) return json({ error: "id required" }, 400);
      const { data, error } = await q.select().single();
      if (error) throw error;
      return json({ movie: data }, req.method === "POST" ? 201 : 200);
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
};
export const config = { path: "/api/admin/movies" };
