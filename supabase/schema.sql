create extension if not exists pgcrypto;
create table if not exists movies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  synopsis text,
  release_year int check (release_year between 1880 and 2100),
  language text not null default 'English',
  category text not null default 'hollywood'
    check (category in ('bollywood','south-dubbed-hindi','hollywood','web-series','animation','family')),
  genres text[] not null default '{}',
  cast_members text[] not null default '{}',
  director text,
  poster_url text, backdrop_url text, trailer_url text,
  streaming_links jsonb not null default '[]',   -- [{"name":"...","url":"https://..."}]
  download_url text,
  license_status text not null default 'copyrighted'
    check (license_status in ('copyrighted','public_domain','permission_granted')),
  license_note text,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- legal guard: downloads only for public domain / permitted content
  constraint download_requires_license check (download_url is null or license_status <> 'copyrighted')
);
create index if not exists movies_pub_idx on movies (published, created_at desc);
create table if not exists admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists favorites (
  user_id uuid references auth.users(id) on delete cascade,
  movie_id uuid references movies(id) on delete cascade,
  list text not null default 'favorite' check (list in ('favorite','watchlist')),
  primary key (user_id, movie_id, list));
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, work_title text not null,
  url text, details text not null, created_at timestamptz default now());
-- Server (service role) bypasses RLS. No public policies on movies/admins/complaints.
alter table movies enable row level security;
alter table admins enable row level security;
alter table complaints enable row level security;
alter table favorites enable row level security;
create policy "own favorites" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sample records: public-domain / freely licensed. No URLs invented; add real ones in admin.
insert into movies (slug,title,synopsis,release_year,language,category,genres,director,license_status,license_note,published,featured) values
('a-trip-to-the-moon-1902','A Trip to the Moon','A group of astronomers travel to the Moon in a capsule fired from a cannon.',1902,'Silent (French)','hollywood','{Sci-Fi,Fantasy}','Georges Méliès','public_domain','Public domain. Verify before offering any file.',true,true),
('nosferatu-1922','Nosferatu','A vampire count brings plague and terror to a German town.',1922,'Silent (German)','hollywood','{Horror}','F. W. Murnau','public_domain','Public domain in the US; verify for your region.',true,false),
('metropolis-1927','Metropolis','In a divided futuristic city, a worker''s son bridges the gap between rulers and laborers.',1927,'Silent (German)','hollywood','{Sci-Fi,Drama}','Fritz Lang','public_domain','Public domain in the US; verify for your region.',true,false),
('night-of-the-living-dead-1968','Night of the Living Dead','Strangers barricade themselves in a farmhouse as the dead begin to walk.',1968,'English','hollywood','{Horror}','George A. Romero','public_domain','Public domain in the US (lapsed notice); verify for your region.',true,false),
('big-buck-bunny-2008','Big Buck Bunny','A giant rabbit takes revenge on three bullying rodents.',2008,'English','animation','{Animation,Family,Comedy}','Sacha Goedegebure','permission_granted','Blender Foundation, Creative Commons Attribution license.',true,false)
on conflict (slug) do nothing;
-- After creating your admin user in Supabase Auth, run:
-- insert into admins (user_id) select id from auth.users where email='YOUR_EMAIL';
