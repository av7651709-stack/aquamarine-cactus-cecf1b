import type { ReactNode } from "react";
import { Link } from "react-router-dom";
const email = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
const Page = ({ t, children }: { t: string; children: ReactNode }) => <main className="wrap narrow glass pad prose"><h1>{t}</h1>{children}<small>Template text: have it reviewed by a qualified lawyer before launch.</small></main>;

export const Privacy = () => <Page t="Privacy Policy">
  <p>ARYAN MOVIE HUB collects only what it needs. If you create an account we store your email address (via Supabase Authentication) and your favorites and watchlist. If you submit a copyright complaint we store the details you provide so we can review it.</p>
  <p>We do not sell personal data. Authentication and database hosting are provided by Supabase; the site is hosted by our cloud provider. Embedded trailers load from YouTube (privacy-enhanced mode) when you view a movie page.</p>
  <p>You can ask us to delete your account data through the <Link to="/contact">contact page</Link>.</p>
</Page>;

export const Terms = () => <Page t="Terms of Use">
  <p>ARYAN MOVIE HUB is a movie information directory. We do not host or distribute copyrighted films. Streaming links point to official services; downloads appear only for public-domain works or content whose owners have given permission.</p>
  <p>Movie information is provided as-is and may contain errors. You agree not to misuse the site, attempt unauthorized access, or submit false copyright claims. We may remove content or accounts at any time.</p>
  <p>Rights holders can report problems using the <Link to="/copyright">copyright complaint form</Link>.</p>
</Page>;

export const Contact = () => <Page t="Contact">
  {email ? <p>Email us at <a href={`mailto:${email}`}>{email}</a>.</p> : <p className="err">Contact email not configured yet. The site owner must set VITE_CONTACT_EMAIL.</p>}
  <p>Copyright issue? Use the <Link to="/copyright">complaint form</Link> so it is recorded.</p>
</Page>;
