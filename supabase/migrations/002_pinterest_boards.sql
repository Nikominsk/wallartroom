create table if not exists pinterest_board (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  created_at timestamptz not null default now()
);

alter table pinterest_board enable row level security;

create policy "pinterest_board_auth_all"
  on pinterest_board for all using (auth.role() = 'authenticated');
