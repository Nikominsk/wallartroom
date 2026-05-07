-- ═══════════════════════════════════════════════════════════════════════════════
-- 005_storage.sql — Supabase Storage buckets for the SaaS
--
-- Three buckets:
--   rooms          — user-uploaded room photos (private, owner-only)
--   artworks       — user-uploaded artwork (private, owner-only)
--   visualizations — generated result images (public read; only owner writes)
--
-- All objects are stored at path "<userId>/<filename>" so the policy can derive
-- ownership from storage.foldername(name)[1] (Supabase's standard pattern).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── BUCKETS ──────────────────────────────────────────────────────────────────

-- Buckets are public-read: RLS still controls who can upload/delete, and
-- objects are stored at <userId>/<uuid>.<ext> so paths are unguessable.
-- This avoids the signed-URL expiry problem when reopening old projects.

insert into storage.buckets (id, name, public)
values
  ('rooms',          'rooms',          true),
  ('artworks',       'artworks',       true),
  ('visualizations', 'visualizations', true)
on conflict (id) do nothing;


-- ─── POLICIES ─────────────────────────────────────────────────────────────────
-- The standard "users can only touch their own folder" pattern.

-- Helper macro idea: each policy compares (storage.foldername(name))[1] to auth.uid().
-- Postgres can't index that, but for upload-rate workloads it's fine.

-- ── rooms ─────────────────────────────────────────────────────────────────────
drop policy if exists "rooms_owner_select" on storage.objects;
create policy "rooms_owner_select" on storage.objects
  for select using (
    bucket_id = 'rooms' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "rooms_owner_insert" on storage.objects;
create policy "rooms_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'rooms' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "rooms_owner_delete" on storage.objects;
create policy "rooms_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'rooms' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── artworks ─────────────────────────────────────────────────────────────────
drop policy if exists "artworks_owner_select" on storage.objects;
create policy "artworks_owner_select" on storage.objects
  for select using (
    bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artworks_owner_insert" on storage.objects;
create policy "artworks_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artworks_owner_delete" on storage.objects;
create policy "artworks_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── visualizations (public read, owner write) ────────────────────────────────
-- Result images need to be shareable (HD export, before/after, PDF report).
-- Anyone with the URL can view, but only the owner can upload/delete.
drop policy if exists "visualizations_public_read" on storage.objects;
create policy "visualizations_public_read" on storage.objects
  for select using ( bucket_id = 'visualizations' );

drop policy if exists "visualizations_owner_insert" on storage.objects;
create policy "visualizations_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'visualizations' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "visualizations_owner_delete" on storage.objects;
create policy "visualizations_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'visualizations' and (storage.foldername(name))[1] = auth.uid()::text
  );
