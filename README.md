# comms
A hub for invites, quick updates, and links shared through emails, texts, and group messages.

## URL scheme

- Root: `https://comms.davidelloyd.com/`
- Invite pages live in folders, e.g. `https://comms.davidelloyd.com/kybalion/`

## Structure

- `kybalion/` — Kybalion invite (current)
- `_templates/invite/` — starter template for new invites

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
