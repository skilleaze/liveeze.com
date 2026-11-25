"""Generate website/projects/marhaba-manzil.html from tools/marhaba.json.
Header/footer are copied from index.html so the site stays consistent."""
import json, os, html, re

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, '..', 'website')
esc = html.escape
groups = json.load(open(os.path.join(HERE, 'marhaba.json')))
G = {g['key']: g for g in groups}

PROJECT_SITE = 'https://marhabamanzil.vercel.app/'
MODEL_3D = 'https://marhabamanzil.vercel.app/House%203D.html'
A = '/assets/projects/marhaba-manzil'
URL = 'https://www.liveeze.com/projects/marhaba-manzil'

FACTS = [('7', 'Bedrooms'), ('8', 'Baths & toilets'), ('2 + 1', 'Floors + open courtyard'), ('3,400', 'Sq ft built-up')]
INFO = [('Project', 'Marhaba Manzil'), ('Type', 'Two-storey residential villa'),
        ('Location', 'Ishwaramangala, Puttur, Dakshina Kannada'),
        ('Design', 'Floor plans, exterior and interior 3D visualisation, front design options, 3D film and interactive 3D model'),
        ('Status', 'Concept design')]
INTRO = ['The dining hall opens wide to an open-to-sky courtyard, so monsoon rain and morning sun reach the centre of the home.',
         'Grey stone, warm teak and cream render keep it calm by day and golden by night.']
GF = {'title': 'Ground floor', 'img': f'{A}/plan-ground.png', 'sheet': 'A-101',
      'areas': 'Plinth ≈ 1,859 sq ft · Courtyard 112 sq ft · Sitout 207 sq ft',
      'rooms': 'Living, dining/family opening to a courtyard, kitchen, store, office, prayer, 2 bedrooms, bath, 2 toilets'}
FF = {'title': 'First floor', 'img': f'{A}/plan-first.png', 'sheet': 'A-102',
      'areas': 'Floor ≈ 1,683 sq ft · Sitout 199 sq ft',
      'rooms': '5 bedrooms (4 with attached bath, 3 with dressing), family lounge, front sitout'}
NOTES = ['Dimensions are in feet and inches, clear inside sizes unless noted. Dimension chains run to wall centrelines.',
         'External walls are 9″ laterite or block. Internal walls are 4½″.',
         'Rooms are sized to a common grid so the walls stack between floors.',
         'Stair: straight flight, 17 risers at about 7½″ with 10″ treads, 3′7″ clear width.',
         'North, setbacks, levels and structure to be confirmed by the site survey, structural engineer and Puttur planning authority.']
SECTIONS = [('exterior', 'Exterior & compound', 'Every side of the house and the plot, from the gate at dusk to the aerial view.'),
            ('ground', 'Ground floor', 'Sitout, living, dining and family around the courtyard, kitchen, office, prayer room and the stair.'),
            ('first', 'First floor', 'Family lounge, balcony sitout and five bedrooms, four with attached baths.'),
            ('cutaway', 'Open-top 3D views', 'The roof lifted off: every room seen from above, with furniture, finishes and circulation.'),
            ('fronts', 'Front design options', 'Twenty-four elevations explored for the front of the house, from premium stone and wood to flat, A-gable, mono-pitch and stepped forms.')]


def fig(key, i, it, label):
    cap = f"{label} · {it['caption']}" if key != 'fronts' else f"Option {i:02d} · {it['caption']}"
    tag = f'<span class="pj-tag">{esc(it["style"])}</span>' if it.get('style') else ''
    num = f'{i:02d} · ' if key == 'fronts' else ''
    return (f'<figure class="pf-item reveal">'
            f'<button class="pf-open" data-full="{it["src"]}" data-caption="{esc(cap)}" aria-label="View {esc(it["caption"])} larger">'
            f'<img src="{it["thumb"]}" width="{it["w"]}" height="{it["h"]}" alt="Marhaba Manzil, {esc(label.lower())}: {esc(it["caption"])}" loading="lazy" decoding="async">{tag}'
            f'</button><figcaption class="pj-cap">{num}{esc(it["caption"])}</figcaption></figure>')


def section(key, title, blurb, n):
    items = G[key]['items']
    figs = '\n'.join(fig(key, i, it, title) for i, it in enumerate(items, 1))
    grid = 'pf-grid pj-grid-fronts' if key == 'fronts' else 'pf-grid'
    return f'''<section class="pf-set pj-set" id="{key}" data-sound>
  <div class="pf-set-head">
    <span class="pf-n">{n:02d}</span>
    <div><p class="eyebrow">Marhaba Manzil</p><h2 class="h2">{esc(title)}</h2></div>
    <p class="pf-blurb">{esc(blurb)}</p>
    <span class="pf-count">{len(items)} views</span>
  </div>
  <div class="{grid}">
{figs}
  </div>
</section>'''


def plan(p):
    return f'''<div class="pj-plan reveal">
      <button class="pf-open pj-plan-img" data-full="{p['img']}" data-caption="{esc(p['title'])} plan · Sheet {p['sheet']}" aria-label="View the {esc(p['title'].lower())} plan larger"><img src="{p['img']}" alt="Marhaba Manzil {esc(p['title'].lower())} plan with room sizes" loading="lazy"></button>
      <dl class="pj-dl">
        <div><dt>Drawing</dt><dd>{esc(p['title'])} plan · Sheet {p['sheet']}</dd></div>
        <div><dt>Areas</dt><dd>{esc(p['areas'])}</dd></div>
        <div><dt>Rooms</dt><dd>{esc(p['rooms'])}</dd></div>
      </dl>
    </div>'''


idx = open(os.path.join(SITE, 'index.html')).read()
header = idx[idx.index('<header class="site-header"'):idx.index('</header>') + 9].replace('href="#', 'href="/#')
header = header.replace('src="assets/', 'src="/assets/')
footer = idx[idx.index('<footer class="footer">'):idx.index('</footer>') + 9].replace('src="assets/', 'src="/assets/')

chips = ''.join(f'<a class="pf-chip" href="#{k}">{esc(t)} <span>{len(G[k]["items"])}</span></a>' for k, t, _ in SECTIONS)
chips = '<a class="pf-chip" href="#film">Film</a>' + chips + '<a class="pf-chip" href="#plans">Floor plans <span>2</span></a><a class="pf-chip" href="#model">3D model</a>'
total = sum(len(g['items']) for g in groups)

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Marhaba Manzil · Residential Villa Project · LIVEEZE</title>
<meta name="description" content="Marhaba Manzil, a two-storey villa in Ishwaramangala, Puttur, designed by LIVEEZE: 7 bedrooms around an open-to-sky courtyard. Exterior and interior 3D views, floor plans, 24 front design options, a 3D film and an interactive 3D model.">
<link rel="canonical" href="{URL}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#282822">
<meta property="og:type" content="article">
<meta property="og:site_name" content="LIVEEZE">
<meta property="og:title" content="Marhaba Manzil · A LIVEEZE villa project">
<meta property="og:description" content="Two storeys, a courtyard open to the sky, and a front that glows at dusk. Ishwaramangala, Puttur.">
<meta property="og:url" content="{URL}">
<meta property="og:image" content="https://www.liveeze.com/assets/og-marhaba.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Marhaba Manzil · A LIVEEZE villa project">
<meta name="twitter:image" content="https://www.liveeze.com/assets/og-marhaba.jpg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/icons/icon-192.png">
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500;600&display=swap">
<link rel="preload" as="image" href="{G['exterior']['items'][0]['src']}">
<link rel="stylesheet" href="/styles.css">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{header}

<main id="main">
<section class="pf-hero pj-hero" data-sound>
  <div class="pf-hero-media"><img src="{G['exterior']['items'][0]['src']}" alt="Marhaba Manzil seen from the gate at dusk"></div>
  <div class="pf-hero-shade"></div>
  <div class="pf-hero-inner">
    <p class="crumbs"><a href="/">Home</a> / <a href="/#projects">Projects</a> / Marhaba Manzil</p>
    <p class="eyebrow eyebrow-light">Residential villa · Ishwaramangala, Puttur</p>
    <h1 class="pf-title">Marhaba Manzil</h1>
    <p class="hero-lead">Two storeys, a courtyard open to the sky, and a front that glows at dusk.</p>
    <div class="hero-actions">
      <a class="btn btn-light" href="#film">Watch the film</a>
      <a class="btn btn-ghost-light" href="{MODEL_3D}" target="_blank" rel="noopener">Open the 3D model</a>
    </div>
  </div>
</section>

<section class="pj-facts" aria-label="Key facts">
  {''.join(f'<div class="pj-fact reveal"><span class="pj-fact-v">{v}</span><span class="pj-fact-k">{k}</span></div>' for v, k in FACTS)}
</section>

<div class="pf-filter" role="navigation" aria-label="Project sections">
  <div class="pf-chips">{chips}</div>
</div>

<section class="pj-intro" data-sound>
  <div>
    <p class="eyebrow">The house</p>
    <h2 class="h2">Built around light, air and a courtyard at its heart.</h2>
  </div>
  <div>
    {''.join(f'<p class="body">{esc(p)}</p>' for p in INTRO)}
    <dl class="pj-dl pj-info">
      {''.join(f'<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>' for k, v in INFO)}
    </dl>
    <p class="pj-links"><a class="btn btn-dark" href="{PROJECT_SITE}" target="_blank" rel="noopener">Visit the project site</a></p>
  </div>
</section>

<section class="pj-film" id="film" data-sound>
  <div class="section-head">
    <p class="eyebrow eyebrow-light">The film</p>
    <h2 class="h2 h2-light">Walk through Marhaba Manzil.</h2>
    <p class="body body-light">The whole home in one 3D film, from the gate to the courtyard and every room. 3 minutes 30 seconds.</p>
  </div>
  <div class="pj-video"><video controls playsinline preload="none" poster="{A}/film-poster.jpg"><source src="{A}/film.mp4" type="video/mp4">Your browser cannot play this film. <a href="{A}/film.mp4">Download it</a>.</video></div>
</section>

<div class="pf-sets">
{chr(10).join(section(k, t, b, n) for n, (k, t, b) in enumerate(SECTIONS, 1))}

<section class="pf-set pj-set" id="plans" data-sound>
  <div class="pf-set-head">
    <span class="pf-n">06</span>
    <div><p class="eyebrow">Marhaba Manzil</p><h2 class="h2">Floor plans</h2></div>
    <p class="pf-blurb">Ground and first floor, drawn to scale with every room size. Tap a plan to enlarge it.</p>
    <span class="pf-count">2 sheets</span>
  </div>
  <div class="pj-plans">
    {plan(GF)}
    {plan(FF)}
  </div>
  <div class="pj-notes reveal">
    <p class="eyebrow">Notes</p>
    <ol>{''.join(f'<li>{esc(n)}</li>' for n in NOTES)}</ol>
    <p class="pj-small">Concept drawings dated 09 Nov 2026, not for construction.</p>
  </div>
</section>
</div>

<section class="pj-model" id="model" data-sound>
  <div class="pj-model-img reveal"><img src="{G['cutaway']['items'][3]['src']}" alt="Marhaba Manzil whole house with the roof open" loading="lazy"></div>
  <div class="pj-model-text">
    <p class="eyebrow eyebrow-light">Interactive 3D</p>
    <h2 class="h2 h2-light">Walk around the house yourself.</h2>
    <p class="body body-light">Turn, zoom and look into every room of the full 3D model. It opens on the Marhaba Manzil project site in a new tab.</p>
    <div class="hero-actions">
      <a class="btn btn-light" href="{MODEL_3D}" target="_blank" rel="noopener">Open the 3D model</a>
      <a class="btn btn-ghost-light" href="{PROJECT_SITE}" target="_blank" rel="noopener">Visit the project site</a>
    </div>
  </div>
</section>

<section class="pf-cta" data-sound>
  <p class="eyebrow eyebrow-light">Your home</p>
  <h2 class="h2 h2-light">Begin your space.</h2>
  <p class="body body-light">From plans and front options to a full 3D walkthrough, we design the whole house with you before a single wall goes up.</p>
  <a href="/#contact" class="btn btn-light">Start a project</a>
</section>
</main>

<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>
  <figure class="lb-stage"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>
  <button class="lb-btn lb-prev" aria-label="Previous image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>
  <button class="lb-btn lb-next" aria-label="Next image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
  <button class="lb-close" aria-label="Close viewer"><span></span><span></span></button>
  <span class="lb-count"></span>
</div>

{footer}

<a href="/#contact" class="fab-cta" aria-label="Start a project">Start a project</a>
<button class="to-top" type="button" aria-label="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg></button>
<script src="/main.js" defer></script>
</body>
</html>
'''
os.makedirs(os.path.join(SITE, 'projects'), exist_ok=True)
open(os.path.join(SITE, 'projects', 'marhaba-manzil.html'), 'w').write(page)
print('project page:', total, 'images + 2 plans')
