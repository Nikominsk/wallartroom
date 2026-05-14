-- Track when an entry in the CSV export history has been confirmed-exported by
-- the operator. Distinct from `pinterest_image.exported_at` (per-image) so the
-- history view can show a green "Exported" badge per export row.

alter table pinterest_csv_export
  add column if not exists marked_exported_at timestamptz;

create index if not exists idx_csv_export_marked_exported_at
  on pinterest_csv_export(marked_exported_at);
