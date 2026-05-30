-- 018: In-app help & founder support system
-- Tables: help_knowledge_base (singleton), help_tickets

CREATE TABLE IF NOT EXISTS help_knowledge_base (
  id         INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS help_tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  question         TEXT NOT NULL,
  ai_response      TEXT,
  ai_answered      BOOLEAN NOT NULL DEFAULT false,
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'answered')),
  admin_reply      TEXT,
  admin_replied_at TIMESTAMPTZ,
  user_read_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS help_tickets_user_id_idx ON help_tickets(user_id);
CREATE INDEX IF NOT EXISTS help_tickets_status_idx  ON help_tickets(status);

ALTER TABLE help_tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_knowledge_base  ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tickets (server uses service role and bypasses this)
CREATE POLICY "users_own_help_tickets" ON help_tickets
  FOR ALL USING (user_id = auth.uid());

-- Anyone authenticated can read the knowledge base
CREATE POLICY "auth_read_help_kb" ON help_knowledge_base
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── Seed the knowledge base ────────────────────────────────────────────────────
INSERT INTO help_knowledge_base (id, content) VALUES (1, $KB$
# WallArtRoom — Complete User Guide

WallArtRoom is a Pinterest workflow automation platform designed for wall art creators, digital artists, and print-on-demand sellers. It streamlines the entire process from uploading artwork images to generating AI-powered Pinterest metadata, scheduling pins, and exporting data for Pinterest.

## Dashboard
The Dashboard (/metadata/dashboard) gives you an overview of your pin activity: total images uploaded, pins by status (draft, scheduled, exported), recent activity, and performance trends. Use it to track your workflow at a glance.

## Uploading Images
Click the "Upload images" button at the top of the sidebar to open the upload modal. You can upload multiple images at once (JPG, PNG, WEBP formats supported). Images are stored securely in the cloud. Free plan users can upload up to 200 images total (lifetime). Pro plan users have unlimited uploads. The upload counter is visible in the upload modal.

## Pin Management

### Drafts (/metadata/drafts)
Drafts are newly uploaded images that have not been scheduled yet. Here you can:
- View all draft images in a gallery grid
- Select one or multiple images for bulk editing
- Generate AI metadata (titles, descriptions, keywords) for selected images
- Assign Pinterest boards, set publish dates, and add descriptions
- Move pins to Scheduled status by assigning a publish date

### Schedules (/metadata/schedules)
Scheduled pins have been assigned a publish date and are ready for export. Here you can:
- View all scheduled pins sorted by planned publish date
- Edit metadata before exporting
- Export selected pins to CSV for Pinterest scheduling
- Filter and search by date or keyword

### Exported (/metadata/posted)
The Exported view shows pins that have been included in a CSV export. These have completed the workflow cycle. You can review them and see their export history. You can move exported pins back to Draft if needed.

## AI Metadata Generation
Select one or more images in any gallery view and click "Generate AI Metadata" (or use the AI button in the toolbar). The AI automatically creates Pinterest-optimized:
- Titles (keyword-rich, up to 100 characters)
- Descriptions (engaging copy, up to 500 characters)
- Keywords and tags

The AI uses your image filename, dominant colors, any additional context you provide, and your Pinterest analytics data to generate relevant metadata tailored to your account's best-performing styles. Free plan users have 500 AI generations total (lifetime). Pro plan is unlimited.

You can configure AI behavior in Settings → AI Templates:
- Set maximum title length (20–100 characters)
- Set maximum description length (50–500 characters)
- Add keywords to always include or always exclude
- Add additional context the AI always considers (e.g. your niche, style, target audience)

## Bulk Editing
Select multiple images using the checkboxes in the gallery, then use the bulk edit panel to:
- Apply the same title, description, board, or publish date to all selected pins
- Generate AI metadata for all selected pins at once
- Move all selected to a different status
- Export all selected to CSV

## Pinterest Boards
Go to Settings → Pinterest to connect your Pinterest account and import your boards. Once boards are imported you can:
- Assign any pin to a specific board from the edit panel
- Use Board Intelligence (Settings → Pinterest → Board Intelligence) to get AI-powered board recommendations for your images
- Import your Pinterest Analytics CSV (exported from Pinterest Business → Analytics → Export data) to help the AI generate metadata that matches your account's top-performing keywords and categories

## CSV Exports
When your pins are scheduled and ready, select them in Schedules view and click "Export CSV". The file is formatted for direct import into Pinterest's bulk pin uploader. Each row includes: title, description, image link, board, publish date, and keywords. After downloading, you can mark the batch as "exported" in the CSV Exports history page (/metadata/csv-exports) to keep your workflow organized.

## Calendar (/metadata/calendar)
The Calendar view shows all scheduled pins on a visual monthly calendar, grouped by publish date. Use it to spot scheduling gaps and ensure consistent posting frequency.

## Settings (/metadata/settings)

### Pinterest Integration
Connect your Pinterest account to import boards. You can also upload your Pinterest Analytics CSV export (from Pinterest Business → Analytics → Export data) so the AI can use your historical performance data to generate better metadata.

### AI Templates
Configure global defaults for AI-generated metadata including title length, description length, always-include keywords, always-exclude keywords, and additional context about your brand or niche.

### Timezone
Set your timezone so that scheduled dates and CSV exports display in your local time.

### Billing / Plan
View your current plan (Free or Pro) and upgrade options. Free plan users see their current usage vs. limits for uploads and AI generations.

## Projects
WallArtRoom supports multiple independent projects — each with its own images, pins, boards, and settings. Use the project switcher at the bottom of the sidebar to switch between projects or create a new one. Projects are useful if you manage multiple Pinterest accounts or different product lines.

## Plans

### Free Plan
- 200 image uploads (lifetime total)
- 500 AI metadata generations (lifetime total)
- All core features: upload, AI generation, CSV export, calendar, board management

### Pro Plan
- Unlimited image uploads
- Unlimited AI metadata generations
- Priority support
- All features

Upgrade at any time via Settings → Billing or via the upgrade prompt that appears when you reach a free plan limit.

## Profile (/metadata/profile)
View and update your account information: display name and account details. Your email address is your login and cannot be changed here.

## Common Questions

Q: Why is my image not showing up after upload?
A: Images process instantly. If an image is missing, try refreshing the page. Also check that you have not reached your upload limit (free plan: 200 images). Your usage is shown in the upload modal.

Q: The AI title is too long or too short. How do I fix it?
A: Go to Settings → AI Templates and adjust the "Max title length" slider. This affects all future AI generations. You can also manually edit any title after generation.

Q: How do I export pins to Pinterest?
A: In the Schedules view, select the pins you want, click "Export CSV", and download the file. Upload the CSV via Pinterest's bulk pin uploader (pinterest.com/business/hub/pin-builder).

Q: Can I schedule a pin for a specific time of day?
A: Yes. When setting a publish date, you can also pick a time. WallArtRoom uses your configured timezone (Settings → Timezone).

Q: How do I import my Pinterest Analytics data?
A: Go to Pinterest Business → Analytics → Export data. Download the CSV. Then go to WallArtRoom → Settings → Pinterest → Import Analytics, and upload the file. The AI will use this data for smarter metadata generation.

Q: I accidentally marked a pin as exported. Can I undo it?
A: Yes. Open the Exported view, select the pin, and use "Move to Draft" to reset its status.

Q: How do I delete an image permanently?
A: Open the image edit panel and use the delete action. Deletion is permanent and cannot be undone.

Q: What does "Board Intelligence" do?
A: It analyzes your uploaded images and Pinterest analytics data to recommend which of your Pinterest boards is the best fit for each image. Find it in Settings → Pinterest.

Q: How many images can I select for bulk editing at once?
A: You can select up to 50 images for a single bulk operation. For larger batches, process them in multiple rounds.

Q: I reached my free plan AI generation limit. What now?
A: Upgrade to Pro for unlimited AI generations. Go to Settings → Billing.

Q: My CSV export is not uploading to Pinterest. Why?
A: Make sure the CSV columns match Pinterest's expected format. WallArtRoom generates standard Pinterest-compatible CSV files. Common issues: the image URL must be publicly accessible, and the board name must exactly match an existing board on your Pinterest account.
$KB$) ON CONFLICT (id) DO NOTHING;
