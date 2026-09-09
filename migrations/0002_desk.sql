create table if not exists desk_profile (
  user_id    text primary key,
  role       text not null default 'analyst',
  created_at timestamptz not null default now()
);

create table if not exists desk_memory (
  id         serial primary key,
  user_id    text not null,
  kind       text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists desk_memory_user_idx on desk_memory (user_id, created_at desc);

create table if not exists desk_watch (
  user_id    text not null,
  fixture_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, fixture_id)
);
