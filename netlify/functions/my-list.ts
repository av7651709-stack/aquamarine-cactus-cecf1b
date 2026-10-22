import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });
const Body = z.object({ movie_id: z.string().uuid(), list: z.enum(["favorite", "watchlist"]) });
const CARD = "id,slug,title,release_year,language,category,genres,poster_url,backdrop_url,featured,published";

export default async (req: Request) => {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
    const { data: auth } = token ? await db.auth.getUser(token) : { data: { user: null } };
    const user = auth.user;
    if (!user) return json({ error: "Please log in" }, 401);

    if (req.method === "GET") {
      const { data, error } = await db.from("favorites").select(`list,movies(${CARD})`).eq("user_id", user.id);
      if (error) throw error;
      const items = (data ?? []).filter((r: any) => r.movies?.published).map((r: any) => ({ list: r.list, movie: r.movies }));
      return json({ items });
    }
    if (req.method === "POST" || req.method === "DELETE") {
      const b = Body.safeParse(await req.json().catch(() => null));
      if (!b.success) return json({ error: "Validation failed" }, 400);
      const q = req.method === "POST"
        ? db.from("favorites").upsert({ user_id: user.id, ...b.data })
        : db.from("favorites").delete().eq("user_id", user.id).eq("movie_id", b.data.movie_id).eq("list", b.data.list);
      const { error } = await q;
      if (error) throw error;
      return json({ ok: true });
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
};
export const config = { path: "/api/my-list" };
