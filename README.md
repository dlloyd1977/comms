# comms
A hub for invites, quick updates, and links shared through emails, texts, and group messages.

## Version
v1.5.0 — Enhanced signup (first/last name), Profile Settings, confirmation email

## URL scheme

- Root: `https://comms.davidelloyd.com/`
- Invite pages live in folders, e.g. `https://comms.davidelloyd.com/kybalion/`

## Structure

- `kybalion/` — Kybalion invite (current)
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

### File Management (Admin)
- **Upload**: Upload files to Supabase Storage via header button
- **New Folder**: Create folders in the document library
- **Delete**: Move files/folders to Trash (soft delete via `.trash/` prefix)
- **Move**: Move files between folders via modal picker
- **Trash Bin**: View, restore, or permanently delete trashed files

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
