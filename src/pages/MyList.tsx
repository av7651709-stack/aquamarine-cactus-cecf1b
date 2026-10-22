import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authFetch, useSession } from "../lib/supabase";
import { Movie } from "../lib/api";
import { Card } from "./Home";

export default function MyList() {
  const { session, ready } = useSession();
  const [tab, setTab] = useState<"favorite" | "watchlist">("favorite");
  const [items, setItems] = useState<{ list: string; movie: Movie }[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { if (session) authFetch("/api/my-list").then(d => setItems(d.items)).catch(e => setErr(e.message)); }, [session]);
  if (!ready) return <main className="wrap"><div className="spin" /></main>;
  if (!session) return <Navigate to="/login?next=/my-list" />;
  const shown = items?.filter(i => i.list === tab) ?? [];
  return (
    <main className="wrap">
      <h1>My list</h1>
      <div className="chips"><button className={tab === "favorite" ? "on" : ""} onClick={() => setTab("favorite")}>Favorites</button><button className={tab === "watchlist" ? "on" : ""} onClick={() => setTab("watchlist")}>Watchlist</button></div>
      {err && <p className="err">{err}</p>}
      {!items && !err && <div className="spin" />}
      {items && !shown.length && <p className="center">Nothing here yet.</p>}
      <div className="grid">{shown.map(i => <Card key={i.movie.id} m={i.movie} />)}</div>
    </main>
  );
}
