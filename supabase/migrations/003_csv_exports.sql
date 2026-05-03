create table if not exists pinterest_csv_export (
  id         uuid        primary key default gen_random_uuid(),
  filename   text        not null,
  row_count  int         not null default 0,
  image_ids  uuid[]      not null default '{}',
  created_at timestamptz not null default now()
);

alter table pinterest_csv_export enable row level security;

create policy "csv_export_auth_all"
  on pinterest_csv_export for all using (auth.role() = 'authenticated');

create index idx_csv_export_created_at on pinterest_csv_export(created_at desc);
