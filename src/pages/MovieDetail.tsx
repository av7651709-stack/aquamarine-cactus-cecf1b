import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, Movie } from "../lib/api";
import { authFetch, useSession } from "../lib/supabase";
import { Card } from "./Home";

type L = "favorite" | "watchlist";
export default function MovieDetail() {
  const { slug } = useParams(); const nav = useNavigate(); const { session } = useSession();
  const [d, setD] = useState<{ movie: Movie; similar: Movie[] } | null>(null);
  const [mine, setMine] = useState<Set<L>>(new Set());
  const [err, setErr] = useState("");
  useEffect(() => {
    setD(null); setErr("");
    api<{ movie: Movie; similar: Movie[] }>(`/api/movies?slug=${encodeURIComponent(slug ?? "")}`).then(x => { setD(x); document.title = `${x.movie.title} – ARYAN MOVIE HUB`; }).catch(e => setErr(e.message));
  }, [slug]);
  useEffect(() => {
    if (!session || !d) return setMine(new Set());
    authFetch("/api/my-list").then(r => setMine(new Set(r.items.filter((i: any) => i.movie.id === d.movie.id).map((i: any) => i.list)))).catch(() => {});
  }, [session, d]);
  if (err) return <main className="wrap center"><p className="err">{err}</p><Link className="btn" to="/">Home</Link></main>;
  if (!d) return <main className="wrap"><div className="spin" /></main>;
  const m = d.movie;
  async function toggle(list: L) {
    if (!session) return nav(`/login?next=/movie/${slug}`);
    const has = mine.has(list);
    try { await authFetch("/api/my-list", { method: has ? "DELETE" : "POST", body: JSON.stringify({ movie_id: m.id, list }) }); const n = new Set(mine); has ? n.delete(list) : n.add(list); setMine(n); } catch (e: any) { setErr(e.message); }
  }
  const share = () => navigator.share ? navigator.share({ title: m.title, url: location.href }) : navigator.clipboard.writeText(location.href);
  const yt = m.trailer_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)?.[1];
  const canDownload = m.download_url && m.license_status !== "copyrighted";
  return (
    <main className="wrap">
      <div className="detail glass">
        {m.poster_url && <img src={m.poster_url} alt={m.title} />}
        <div>
          <h1>{m.title}</h1>
          <p className="meta">{m.release_year} · {m.language} · {m.genres.join(", ")}</p>
          {m.director && <p><b>Director:</b> {m.director}</p>}
          {!!m.cast_members?.length && <p><b>Cast:</b> {m.cast_members.join(", ")}</p>}
          <p>{m.synopsis}</p>
          <div className="row">
            {m.streaming_links?.map(s => <a key={s.url} className="btn" href={s.url} target="_blank" rel="noopener noreferrer">Watch on {s.name}</a>)}
            {canDownload && <a className="btn alt" href={m.download_url!} target="_blank" rel="noopener noreferrer">Download (licensed)</a>}
            <button className="btn alt" onClick={() => toggle("favorite")}>{mine.has("favorite") ? "♥ Favorited" : "♡ Favorite"}</button>
            <button className="btn alt" onClick={() => toggle("watchlist")}>{mine.has("watchlist") ? "✓ In watchlist" : "+ Watchlist"}</button>
            <button className="btn alt" onClick={share}>Share</button>
          </div>
          {m.license_note && <small>License: {m.license_note}</small>}
        </div>
      </div>
      {yt && <iframe className="trailer" src={`https://www.youtube-nocookie.com/embed/${yt}`} title="Trailer" allowFullScreen />}
      {!!d.similar.length && <><h2>Similar movies</h2><div className="grid">{d.similar.map(s => <Card key={s.id} m={s} />)}</div></>}
    </main>
  );
}
