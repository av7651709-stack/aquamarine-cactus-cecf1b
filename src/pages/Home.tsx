import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Movie } from "../lib/api";

export const Card = ({ m }: { m: Movie }) => (
  <Link to={`/movie/${m.slug}`} className="card glass">
    {m.poster_url ? <img src={m.poster_url} alt={m.title} loading="lazy" /> : <div className="noposter">{m.title}</div>}
    <h3>{m.title}</h3><small>{m.release_year ?? ""} · {m.language}</small>
    <span className="btn sm">Details</span>
  </Link>
);
const CATS = ["", "bollywood", "south-dubbed-hindi", "hollywood", "web-series", "animation", "family"];

export default function Home() {
  const [f, setF] = useState({ q: "", language: "", year: "", genre: "", category: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ movies: Movie[]; pages: number } | null>(null);
  const [hero, setHero] = useState<Movie | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => { api<{ movies: Movie[] }>("/api/movies?featured=1").then(d => setHero(d.movies[0] ?? null)).catch(() => {}); }, []);
  useEffect(() => {
    setData(null); setErr("");
    const qs = new URLSearchParams({ ...f, page: String(page) });
    [...qs.keys()].forEach(k => !qs.get(k) && qs.delete(k));
    api<{ movies: Movie[]; pages: number }>(`/api/movies?${qs}`).then(setData).catch(e => setErr(e.message));
  }, [f, page]);
  const set = (k: string, v: string) => { setPage(1); setF({ ...f, [k]: v }); };

  return (
    <main className="wrap">
      {hero && <Link to={`/movie/${hero.slug}`} className="hero glass" style={hero.backdrop_url ? { backgroundImage: `url(${hero.backdrop_url})` } : undefined}>
        <small>FEATURED</small><h1>{hero.title}</h1><p>{hero.release_year} · {hero.genres.join(", ")}</p></Link>}
      <div className="filters glass">
        <input placeholder="Search movies…" value={f.q} onChange={e => set("q", e.target.value)} />
        <input placeholder="Language" value={f.language} onChange={e => set("language", e.target.value)} />
        <input placeholder="Year" inputMode="numeric" value={f.year} onChange={e => set("year", e.target.value)} />
        <input placeholder="Genre" value={f.genre} onChange={e => set("genre", e.target.value)} />
      </div>
      <div className="chips">{CATS.map(c => <button key={c} className={f.category === c ? "on" : ""} onClick={() => set("category", c)}>{c || "all"}</button>)}</div>
      {err && <p className="err">{err}</p>}
      {!data && !err && <div className="spin" aria-label="Loading" />}
      {data && !data.movies.length && <p className="center">No movies found.</p>}
      <div className="grid">{data?.movies.map(m => <Card key={m.id} m={m} />)}</div>
      {data && data.pages > 1 && <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span>{page}/{data.pages}</span>
        <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </main>
  );
}
