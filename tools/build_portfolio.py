"""Generate portfolio.html and the homepage portfolio section from portfolio.json."""
import json, re, html

import os
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, '..', 'website')
data = json.load(open(os.path.join(HERE, 'portfolio.json')))

# Collections in the order shown, named after the source PDFs.
CATS = [
    ('residence',   'Residence exteriors',          'Exteriors',   'Villas and family homes: façades, entrances, lighting and front landscaping.'),
    ('commercial',  'Commercial building exteriors', 'Exteriors',   'Office, retail and mixed-use buildings with a strong street presence.'),
    ('hospitality', 'Hospitality',                   'Commercial',  'Restaurants, cafés and hotel lobbies designed around atmosphere and flow.'),
    ('office',      'Office designs',                'Commercial',  'Executive cabins, open workstations, lounges and meeting rooms.'),
    ('living',      'Living rooms',                  'Residential', 'Calm, layered living spaces with integrated lighting and feature walls.'),
    ('dining',      'Dining halls',                  'Residential', 'Dining rooms composed around the table, the light above it and the wall behind it.'),
    ('kitchen',     'Kitchens',                      'Residential', 'Modular kitchens, islands and breakfast counters with concealed lighting.'),
    ('bedroom',     'Bedrooms',                      'Residential', 'Restful bedrooms: upholstered headboards, panelled walls and soft lighting.'),
    ('wardrobe',    'Wardrobe designs',              'Joinery',     'Full-height wardrobes, glass display units and dressing areas.'),
    ('tvunit',      'TV units',                      'Joinery',     'Media walls and floating consoles in wood, stone and lacquer.'),
    ('restroom',    'Restrooms',                     'Residential', 'Bathrooms with walk-in showers, backlit mirrors and floating vanities.'),
    ('balcony',     'Balconies & landscaping',       'Outdoor',     'Balconies and terraces with planting, seating and evening lighting.'),
]
TOTAL = sum(len(data[k]) for k, *_ in CATS)
esc = html.escape


ALT = {'residence': 'Residence exterior design', 'commercial': 'Commercial building exterior design', 'hospitality': 'Hospitality interior design',
       'office': 'Office interior design', 'living': 'Living room interior design', 'dining': 'Dining room interior design',
       'kitchen': 'Kitchen interior design', 'bedroom': 'Bedroom interior design', 'wardrobe': 'Wardrobe design',
       'tvunit': 'TV unit design', 'restroom': 'Bathroom and restroom design', 'balcony': 'Balcony and landscape design'}


def figure(cat, name, i, it):
    alt = f'{ALT[cat]} by LIVEEZE, {i:02d}'
    return (f'<figure class="pf-item reveal" data-cat="{cat}">'
            f'<button class="pf-open" data-full="{it["src"]}" data-caption="{esc(name)} · {i:02d}" aria-label="View {esc(alt)} larger">'
            f'<img src="{it["thumb"]}" width="{it["w"]}" height="{it["h"]}" alt="{esc(alt)}" loading="lazy" decoding="async">'
            f'</button></figure>')


sections = []
for n, (cat, name, group, blurb) in enumerate(CATS, 1):
    items = data[cat]
    figs = '\n'.join(figure(cat, name, i, it) for i, it in enumerate(items, 1))
    sections.append(f'''<section class="pf-set" id="{cat}" data-cat="{cat}" data-sound>
  <div class="pf-set-head">
    <span class="pf-n">{n:02d}</span>
    <div>
      <p class="eyebrow">{group}</p>
      <h2 class="h2">{esc(name)}</h2>
    </div>
    <p class="pf-blurb">{esc(blurb)}</p>
    <span class="pf-count">{len(items)} designs</span>
  </div>
  <div class="pf-grid">
{figs}
  </div>
</section>''')

chips = ['<button class="pf-chip is-on" data-filter="all" aria-pressed="true">All <span>{}</span></button>'.format(TOTAL)]
chips += [f'<button class="pf-chip" data-filter="{c}" aria-pressed="false">{esc(nm)} <span>{len(data[c])}</span></button>' for c, nm, *_ in CATS]

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Portfolio · LIVEEZE</title>
<meta name="description" content="The LIVEEZE portfolio: {TOTAL} designs across residence and commercial exteriors, hospitality, offices, living rooms, dining, kitchens, bedrooms, wardrobes, TV units, restrooms and balconies.">
<link rel="canonical" href="https://www.liveeze.com/portfolio">
<meta name="theme-color" content="#282822">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LIVEEZE">
<meta property="og:title" content="Portfolio · LIVEEZE">
<meta property="og:description" content="{TOTAL} designs across twelve collections, from building façades to the finest joinery.">
<meta property="og:url" content="https://www.liveeze.com/portfolio">
<meta property="og:image" content="https://www.liveeze.com/assets/og-portfolio.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Portfolio · LIVEEZE">
<meta name="twitter:image" content="https://www.liveeze.com/assets/og-portfolio.jpg">
<link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="assets/icons/icon-192.png">
<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500;600&display=swap">
<link rel="stylesheet" href="styles.css">
<script>document.documentElement.classList.add('js','page-portfolio')</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="site-header" id="top">
  <a href="/" class="brand" aria-label="LIVEEZE home">
    <img class="brand-light" src="assets/logo/wordmark-ivory.png" alt="LIVEEZE">
    <img class="brand-dark" src="assets/logo/wordmark-charcoal.png" alt="" aria-hidden="true">
  </a>
  <nav class="nav" aria-label="Main">
    <a href="/#services">Services</a>
    <a href="/#process">Process</a>
    <a href="/portfolio" class="is-current" aria-current="page">Portfolio</a>
    <a href="/#studio">Studio</a>
    <a href="/#faq">FAQ</a>
    <a href="/#contact" class="nav-cta">Start a project</a>
  </nav>
  <div class="header-tools">
    <button class="sound-btn" type="button" aria-pressed="false" aria-label="Sound">
      <span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="sound-label">Sound</span>
    </button>
    <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
  </div>
</header>

<main id="main">
<section class="pf-hero" data-sound>
  <div class="pf-hero-media"><img src="{data['residence'][5]['src']}" alt=""></div>
  <div class="pf-hero-shade"></div>
  <div class="pf-hero-inner">
    <p class="crumbs"><a href="/">Home</a> / Portfolio</p>
    <h1 class="pf-title">Design collections.</h1>
    <p class="hero-lead">{TOTAL} designs across twelve collections, from building façades to the finest joinery. Choose a collection, or open any design to view it full screen.</p>
  </div>
</section>

<div class="pf-filter" role="toolbar" aria-label="Filter collections">
  <div class="pf-chips">
    {''.join(chips)}
  </div>
</div>

<div class="pf-sets">
{''.join(sections)}
</div>

<section class="pf-cta" data-sound>
  <p class="eyebrow eyebrow-light">Your space</p>
  <h2 class="h2 h2-light">Begin your space.</h2>
  <p class="body body-light">Tell us which collection speaks to you. We will shape it around how you live and work.</p>
  <a href="/#contact" class="btn btn-light">Start a project</a>
</section>
</main>

<div class="lightbox" role="dialog" aria-modal="true" aria-label="Design viewer" hidden>
  <figure class="lb-stage"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>
  <button class="lb-btn lb-prev" aria-label="Previous design"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>
  <button class="lb-btn lb-next" aria-label="Next design"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
  <button class="lb-close" aria-label="Close viewer"><span></span><span></span></button>
  <span class="lb-count"></span>
</div>

<footer class="footer">
  <div class="footer-top">
    <div class="footer-brand">
      <img class="footer-mark" src="assets/logo/wordmark-charcoal.png" alt="LIVEEZE" width="180" height="26">
      <p class="tagline">LIVE EXQUISITELY.</p>
      <p class="footer-about">A full-service design and build studio for residential and commercial spaces. One team from first sketch to final key.</p>
    </div>
    <nav class="footer-col" aria-label="Studio">
      <p class="footer-h">Studio</p>
      <a href="/#services">Services</a><a href="/#process">Process</a><a href="/#studio">Our story</a><a href="/#faq">FAQ</a><a href="/#contact">Contact</a>
    </nav>
    <nav class="footer-col" aria-label="Portfolio">
      <p class="footer-h">Portfolio</p>
      <a href="/portfolio#residence">Residence exteriors</a><a href="/portfolio#commercial">Commercial buildings</a><a href="/portfolio#hospitality">Hospitality</a><a href="/portfolio#office">Offices</a><a href="/portfolio#living">Interiors</a><a href="/portfolio#balcony">Landscaping</a>
    </nav>
    <div class="footer-col">
      <p class="footer-h">Contact</p>
      <a href="mailto:info@liveeze.com">info@liveeze.com</a>
      <a href="/#contact">Start a project</a>
    </div>
  </div>
  <div class="footer-row">
    <span>© <span id="year">2026</span> LIVEEZE. All rights reserved.</span>
    <a href="/privacy">Privacy</a>
  </div>
</footer>

<a href="/#contact" class="fab-cta" aria-label="Start a project">Start a project</a>
<button class="to-top" type="button" aria-label="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg></button>

<script src="main.js" defer></script>
</body>
</html>
'''
open(f'{SITE}/portfolio.html', 'w').write(page)

# ---------- Homepage: collections section ----------
COVER = {'residence': 5, 'commercial': 2, 'hospitality': 1, 'office': 3, 'living': 3, 'dining': 6,
         'kitchen': 5, 'bedroom': 6, 'wardrobe': 5, 'tvunit': 4, 'restroom': 2, 'balcony': 2}
tiles = []
for n, (cat, name, group, blurb) in enumerate(CATS, 1):
    it = data[cat][COVER[cat] - 1]
    tiles.append(f'''    <a class="col-tile reveal" href="/portfolio#{cat}">
      <span class="col-img wipe"><img src="{it['thumb']}" width="{it['w']}" height="{it['h']}" alt="" loading="lazy" decoding="async"></span>
      <span class="col-meta"><span class="col-n">{n:02d}</span><span class="col-name">{esc(name)}</span><span class="col-count">{len(data[cat])}</span></span>
    </a>''')

block = f'''<!-- PORTFOLIO:START -->
<section class="collections" id="portfolio" data-sound>
  <div class="section-head section-head-row">
    <div>
      <p class="eyebrow">Portfolio</p>
      <h2 class="h2">Twelve collections, {TOTAL} designs.</h2>
    </div>
    <a href="/portfolio" class="btn btn-dark">View the full portfolio</a>
  </div>
  <div class="col-grid">
{chr(10).join(tiles)}
  </div>
</section>
<!-- PORTFOLIO:END -->'''

idx = open(f'{SITE}/index.html').read()
if '<!-- PORTFOLIO:START -->' in idx:
    idx = re.sub(r'<!-- PORTFOLIO:START -->.*?<!-- PORTFOLIO:END -->', block, idx, flags=re.S)
else:
    idx = idx.replace('<!-- STORY -->', block + '\n\n<!-- STORY -->', 1)

# Nav: add Portfolio
idx = idx.replace('<a href="#spaces">Spaces</a>\n    <a href="#studio">Studio</a>',
                  '<a href="#portfolio">Portfolio</a>\n    <a href="#studio">Studio</a>')
idx = idx.replace('<a href="#spaces">Spaces</a><a href="#studio">Studio</a>',
                  '<a href="/portfolio">Portfolio</a><a href="#studio">Studio</a>')
open(f'{SITE}/index.html', 'w').write(idx)
print('portfolio items', TOTAL)
