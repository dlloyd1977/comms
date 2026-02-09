# Invite Template

Copy this folder to create a new shareable invite page.

## Create a new invite

1) Copy `_templates/invite` to a new folder at the repo root:
- Example: `bookclub/`
- Example: `meetup/`
- Example: `seminar/`

2) Update the HTML:
- Title text
- Description text
- Signature/contact info

3) Add a preview image:
- Put it at: `<slug>/images/preview.png`
- Keep it reasonably small (e.g. 1200×630-ish works well for previews)

4) Update the meta tags in `<head>`:
- `canonical`
- `og:url`
- `og:image`
- `twitter:image`

For a slug like `bookclub`, your final URLs should look like:
- `https://comms.davidelloyd.com/bookclub/`
- `https://comms.davidelloyd.com/bookclub/images/preview.png`

## Notes

- `index.html` is served automatically for the folder URL.
- Some chat apps cache link previews; if you don’t see changes immediately, try a new thread or wait a bit.
