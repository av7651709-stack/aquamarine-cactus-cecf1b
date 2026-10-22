import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import MyList from "./pages/MyList";
import Copyright from "./pages/Copyright";
import { Privacy, Terms, Contact } from "./pages/Legal";
import { supabase, useSession } from "./lib/supabase";
import "./styles.css";
import "./part2.css";

const Header = () => {
  const { session } = useSession();
  return (
    <header className="top nav">
      <Link to="/" className="logo"><span>ARYAN</span> MOVIE HUB</Link>
      <nav>
        {session && <Link to="/my-list">My List</Link>}
        <Link to="/admin">Admin</Link>
        {session ? <button onClick={() => supabase.auth.signOut()}>Log out</button> : <Link to="/login">Log in</Link>}
      </nav>
    </header>
  );
};
const NotFound = () => <main className="wrap center"><h1>404</h1><p>This page doesn’t exist.</p><Link className="btn" to="/">Go home</Link></main>;

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movie/:slug" element={<MovieDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/my-list" element={<MyList />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/copyright" element={<Copyright />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <footer className="foot">
      <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/contact">Contact</Link><Link to="/copyright">Copyright complaint</Link>
      <div>© ARYAN MOVIE HUB · Metadata only. We host no pirated files.</div>
    </footer>
  </BrowserRouter>
);
