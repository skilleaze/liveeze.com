# LIVEEZE — Website

Full-service interior architecture, design and build studio. Tagline: **LIVE EXQUISITELY.** · Live at https://liveeze.com

## Structure

```
├── CLAUDE.md      ← brand rules
├── vercel.json    ← tells Vercel to serve /website (no build step)
└── website/
    ├── index.html
    ├── styles.css
    └── assets/ (images/, logo/)
```

## Deploy

Hosted on Vercel, connected to this repo. Every push to `main` goes live on liveeze.com automatically.

## Open items
- `info@liveeze.com` is a placeholder email (contact section + form action).
- Contact form uses `mailto:`; swap for Formspree or similar for a real form.
- Full brand kit (lockups, app icons, brand book) lives in the Google Drive folder, not in this repo.
