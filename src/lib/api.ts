export type Movie = {
  id: string; slug: string; title: string; release_year: number | null; language: string; category: string;
  genres: string[]; poster_url: string | null; backdrop_url: string | null; featured: boolean;
  synopsis?: string | null; cast_members?: string[]; director?: string | null; trailer_url?: string | null;
  streaming_links?: { name: string; url: string }[]; download_url?: string | null;
  license_status?: string; license_note?: string | null;
};
export async function api<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Request failed");
  return r.json();
}
