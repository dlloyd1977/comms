# comms
A hub for invites, quick updates, and links shared through emails, texts, and group messages.

## Version
v3.8.1 — Auth login timeout safeguards to prevent stalled sign-in state

## URL scheme

- Root: `https://comms.davidelloyd.com/`
- Invite pages live in folders, e.g. `https://comms.davidelloyd.com/kybalion/`
- Converted invites live at `/kybalion`, `/bookclub`, and `/templates/invite`
- Legacy pages are preserved under `https://comms.davidelloyd.com/old/`

## Structure

- `kybalion/` — Kybalion invite (current)
  - `kybalion-next/nextjs/` — Next.js + Supabase SaaS template (migration target)
    - `nextjs/src/app/kybalion/docs/` — Next.js docs rebuild (Phase 2 in progress)
    - `nextjs/public/kybalion/docs/` — Static Kybalion docs preserved at `/kybalion/docs/`
    - `nextjs/public/old-static/` — Legacy comms pages copied into `/old/` routes
    - `nextjs/public/kybalion/images/` — Assets used by converted Kybalion invites
    - `nextjs/public/bookclub/images/` — Assets used by converted Book Club invite
  - `kybalion/docs/` — Document library with Supabase storage backend
  - `kybalion/docs/admin.js` — Admin functionality: auth, uploads, layout editing, file management, profile settings
  - `kybalion/docs/styles.css` — Docs page styles
  - `kybalion/migrations/` — SQL migration scripts for Supabase
- `_templates/invite/` — starter template for new invites

## Kybalion Docs Features

### Auth & Access
- Supabase-based authentication with admin/member roles
- Signup captures first name, last name, email, and password (names required)
- Auto-enrollment trigger populates `active_members` on signup
- Confirmation email sent on signup with redirect to main page
- Guest access with limited functionality (grayed-out menu items)
- Close button on sign-in popup

### Profile Settings
- Accessible via Profile button (visible when signed in, both pages)
- Editable fields: first name, last name, nickname, middle initial, phone, address
- Email displayed as read-only
- RLS policies allow members to view/update their own profile

### Layout Editing (Admin)
- Draggable/resizable header elements including Edit/Reset buttons
- Layout persistence via Supabase (`kybalion_layout` table)
- Shared layout visible to all authenticated members

#### Supabase Layout Requirements
- `kybalion_layout.id` must be a PRIMARY KEY or UNIQUE index (required for `upsert(..., { onConflict: "id" })`).
- Row Level Security must allow active members to read and admins to write.

```sql
create table if not exists public.kybalion_layout (
  id integer primary key,
  positions jsonb not null default '{}'::jsonb,
  "order" jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now(),
  updated_by text
);

alter table public.kybalion_layout enable row level security;

create policy "read layout for active members"
on public.kybalion_layout
for select
to authenticated
using (
  exists (
    select 1
    from public.active_members m
    where lower(m.email) = lower(auth.jwt() ->> 'email')
      and m.status = 'active'
  )
);

create policy "admins write layout"
on public.kybalion_layout
for all
to authenticated
using (
  exists (
    select 1
    from public.active_members m
    where lower(m.email) = lower(auth.jwt() ->> 'email')
      and m.status = 'active'
      and m."group" = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.active_members m
    where lower(m.email) = lower(auth.jwt() ->> 'email')
      and m.status = 'active'
      and m."group" = 'admin'
  )
);
```

### File Management (Admin)
- **Upload**: Upload files to Supabase Storage via header button
- **New Folder**: Create folders in the document library
- **Delete**: Move files/folders to Trash (soft delete via `.trash/` prefix)
- **Move**: Move files between folders via modal picker
- **Trash Bin**: View, restore, or permanently delete trashed files

### Lite ZIP Outputs
- Project lite zip bundles are built into [lite_zips](../lite_zips) via the workspace tasks.
- Lite zip outputs are build artifacts and should not be committed or pushed.
- Naming convention: `{top_level_project}_lite-zip_{YYYYMMDD}_{HHMM}.zip`
- Output location: `lite_zips/{top_level_project}/...`
- Top-level project names must be meaningful (avoid generic names like `docs` or `comms`).
- For Kybalion docs, the top-level project name is `kybalion`.

## Create a new invite

1) Copy the template folder to a new slug:
- Copy `_templates/invite/` → `bookclub/` (example)

2) Edit the new page:
- Update text in `bookclub/index.html`
- Add your image at `bookclub/images/preview.png`
- Update `canonical` / Open Graph / Twitter URLs to match `https://comms.davidelloyd.com/bookclub/`

3) Push to GitHub

Your new invite will be live at:
- `https://comms.davidelloyd.com/bookclub/`
