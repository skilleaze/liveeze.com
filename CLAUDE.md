# CLAUDE.md — LIVEEZE brand rules

Follow these rules for every design, page, document or asset made for LIVEEZE.

## Workflow
- The live site is `website/` (plain HTML + CSS, no build step). Vercel serves `website/` as configured in `vercel.json`.
- Every push to `main` deploys automatically to liveeze.com via Vercel's GitHub integration.
- Portfolio: `website/portfolio.html` (served at /portfolio) with 12 collections from the client's PDFs; images in `website/assets/portfolio/<collection>/NN.jpg` (+ `NN-s.jpg` thumbnails); client confirmed rights to use all designs except the AeshDecorStudio-watermarked commercial image (excluded). Homepage `#portfolio` section links to each collection (/portfolio#kitchen etc.).
- Performance rule (client request): no heavy 3D (no CSS 3D scenes, scroll-jacking, custom cursor, backdrop blur). Animate only transform/opacity. If an effect could lag, leave it out.
- Sound: Web Audio, synthesised in main.js. Turns on at the visitor's first tap/click (browsers block earlier autoplay), mute toggle in header remembered in localStorage. iOS unlock via silent media element + navigator.audioSession.
- Share images: assets/og-image.jpg (home) and assets/og-portfolio.jpg (1200x630). Icons in assets/icons. Pages: index, portfolio, privacy, 404; sitemap.xml, robots.txt, site.webmanifest.
- Contact email info@liveeze.com is still a placeholder until the client confirms it; no phone/address/socials provided yet (do not invent them).
- GitHub repo: skilleaze/liveeze.com · Vercel project: liveeze.com (team skilleazecom-3109) · Domain DNS at GoDaddy (A @ → 216.150.1.1, CNAME www → Vercel). liveeze.com redirects to www.liveeze.com.

## Business
LIVEEZE is a full-service design and build studio for residential and commercial spaces. Services: interior architecture, exterior & interior 3D visualisation, furniture layout, furniture design & development, lighting design, material selection, landscape planning, contracting, consulting, turnkey solutions. One team from first sketch to final key.

## Names
- Brand name: LIVEEZE (always uppercase in logo contexts)
- Domain: liveeze.com
- Tagline: LIVE EXQUISITELY. — always Montserrat Medium, uppercase, letter-spacing 0.6em, with the full stop. Never italic, never Playfair.

## Colour — use ONLY these
- Ivory #FBF9F4 (main background)
- Sand #E8DBCB (secondary background)
- Beige #CFB9A0 (accent lines, small details)
- Stone #C1B7AA (dividers, muted)
- Forest #353B2A (dark sections, accent)
- Charcoal #282822 (text, dark sections)
No black, no gold, no other colours.

## Typography
- Primary: Playfair Display (400 / 500, italic sparingly) — headlines and body
- Secondary: Montserrat Medium 500 — eyebrow labels, buttons, nav, tagline; uppercase, tracked 0.24–0.6em
- Google Fonts: `family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500;600`

## Logo
- Wordmark and monogram files used by the site: `website/assets/logo/`
- Clear space = height of the letter E on all sides. Minimum width: wordmark 120px / 30mm, monogram 24px / 8mm.
- Never stretch, rotate, recolour outside the palette, or place on low-contrast backgrounds.

## Style
- Quiet luxury: generous whitespace, thin 1px rules in Beige/Stone, square corners, no shadows except subtle print mockups.
- Photography: warm natural light, beige/stone/forest tones, architecture and natural materials.
- Copy: calm, precise, no exclamation marks.

## Brand story (reference)
- Story: clients usually manage many separate parties; LIVEEZE brings every discipline under one roof. "You keep the joy of creating a space. We carry the complexity."
- Name: LIVE (how people live and work in a space) + EZE (ease: effortless space, effortless process). The double E stands for Elegance and Ease.
- Tagline: exquisite, from Latin exquisitus, "carefully sought out". The full stop = complete, like a turnkey handover.
- Monogram: upright = architecture & permanence; swash = design & comfort; taper = from structure to the finest detail.
