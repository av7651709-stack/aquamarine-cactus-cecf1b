import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });
const C = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  work_title: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(500).optional().or(z.literal("")),
  details: z.string().trim().min(20).max(4000),
  website: z.string().max(200).optional(), // honeypot: real users leave this empty
});
export default async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const p = C.safeParse(await req.json().catch(() => null));
    if (!p.success) return json({ error: "Please check the form fields", issues: p.error.flatten().fieldErrors }, 400);
    if (p.data.website) return json({ ok: true }); // bot: pretend success
    const { website, url, ...rest } = p.data;
    const { error } = await db.from("complaints").insert({ ...rest, url: url || null });
    if (error) throw error;
    return json({ ok: true }, 201);
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
};
export const config = { path: "/api/complaints" };
