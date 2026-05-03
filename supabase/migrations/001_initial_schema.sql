-- ═══════════════════════════════════════════════════════════════════════════════
-- 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── COLORS ───────────────────────────────────────────────────────────────────

create table if not exists color (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  hex   text not null
);

insert into color (name, hex) values
  ('White',      '#FFFFFF'),
  ('Cream',      '#F5ECD7'),
  ('Beige',      '#D4C5A9'),
  ('Yellow',     '#F5C518'),
  ('Gold',       '#C5A059'),
  ('Orange',     '#E07B39'),
  ('Terracotta', '#C2694F'),
  ('Red',        '#C0392B'),
  ('Pink',       '#E8A598'),
  ('Mauve',      '#B5838D'),
  ('Purple',     '#8E44AD'),
  ('Lavender',   '#D7BDE2'),
  ('Navy',       '#1A1A2E'),
  ('Blue',       '#2980B9'),
  ('Teal',       '#1ABC9C'),
  ('Sage',       '#A8C5A0'),
  ('Green',      '#27AE60'),
  ('Brown',      '#795548'),
  ('Gray',       '#9E9E9E'),
  ('Black',      '#212121');


-- ─── IMAGE ────────────────────────────────────────────────────────────────────

create table if not exists image (
  id                  uuid        primary key default gen_random_uuid(),
  filename            text        not null,
  public_url          text        not null,
  thumbnail_url       text,
  prompt              text,
  visibility          text        not null default 'open'
                                  check (visibility in ('open', 'hidden', 'draft')),
  primary_color_id    uuid        references color(id) on delete set null,
  secondary_color_id  uuid        references color(id) on delete set null,
  tertiary_color_id   uuid        references color(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ─── SHORT ID GENERATORS ──────────────────────────────────────────────────────
-- Character set: A-Z (no O) + 1-9 (no 0) = 34 characters, 34^5 ≈ 45M combinations.

create or replace function generate_pin_id() returns text as $$
declare
  chars  text := 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  result text;
begin
  loop
    result := '';
    for i in 1..5 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from pinterest_image where pin_id = result);
  end loop;
  return result;
end;
$$ language plpgsql;

create or replace function generate_adobe_id() returns text as $$
declare
  chars  text := 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  result text;
begin
  loop
    result := '';
    for i in 1..5 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from adobe_image where adobe_id = result);
  end loop;
  return result;
end;
$$ language plpgsql;


-- ─── PINTEREST IMAGE ──────────────────────────────────────────────────────────
-- PK = image.id (shared primary key, 1:1 relationship).

create table if not exists pinterest_image (
  image_id      uuid        primary key references image(id) on delete cascade,
  pin_id        text        not null unique default generate_pin_id()
                            check (pin_id ~ '^[ABCDEFGHIJKLMNPQRSTUVWXYZ123456789]{5}$'),
  title         text        check (char_length(title) <= 100),
  description   text        check (char_length(description) <= 500),
  board         text,
  link          text,
  publish_date  timestamptz,
  exported_at   timestamptz,
  published_at  timestamptz,
  status        text        not null default 'draft'
                            check (status in ('draft', 'ready', 'exported', 'published', 'error')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- ─── ADOBE IMAGE ──────────────────────────────────────────────────────────────
-- PK = image.id (shared primary key, 1:1 relationship).

create table if not exists adobe_image (
  image_id      uuid        primary key references image(id) on delete cascade,
  adobe_id      text        not null unique default generate_adobe_id()
                            check (adobe_id ~ '^[ABCDEFGHIJKLMNPQRSTUVWXYZ123456789]{5}$'),
  title         text        check (char_length(title) <= 200),
  description   text        check (char_length(description) <= 500),
  keywords      text[],
  publish_date  timestamptz,
  status        text        not null default 'draft'
                            check (status in ('draft', 'ready', 'scheduled', 'submitted', 'error')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- ─── AUTO-UPDATE updated_at ───────────────────────────────────────────────────

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger image_updated_at
  before update on image
  for each row execute function set_updated_at();

create trigger pinterest_image_updated_at
  before update on pinterest_image
  for each row execute function set_updated_at();

create trigger adobe_image_updated_at
  before update on adobe_image
  for each row execute function set_updated_at();


-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index idx_image_visibility        on image(visibility);
create index idx_image_primary_color     on image(primary_color_id);
create index idx_image_secondary_color   on image(secondary_color_id);
create index idx_image_tertiary_color    on image(tertiary_color_id);
create index idx_pinterest_pin_id        on pinterest_image(pin_id);
create index idx_pinterest_status        on pinterest_image(status);
create index idx_pinterest_publish_date  on pinterest_image(publish_date);
create index idx_adobe_adobe_id          on adobe_image(adobe_id);
create index idx_adobe_status            on adobe_image(status);
create index idx_adobe_publish_date      on adobe_image(publish_date);


-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

alter table color           enable row level security;
alter table image           enable row level security;
alter table pinterest_image enable row level security;
alter table adobe_image     enable row level security;

-- Anyone can read colors
create policy "colors_public_read"
  on color for select using (true);

-- Anyone can read open images
create policy "images_public_read"
  on image for select using (visibility = 'open');

-- Authenticated users have full access
create policy "images_auth_all"
  on image for all using (auth.role() = 'authenticated');

create policy "pinterest_auth_all"
  on pinterest_image for all using (auth.role() = 'authenticated');

create policy "adobe_auth_all"
  on adobe_image for all using (auth.role() = 'authenticated');
