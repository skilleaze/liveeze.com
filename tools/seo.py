"""Write JSON-LD structured data into the pages and generate sitemap.xml.
Run after build_portfolio.py:  python3 tools/build_portfolio.py && python3 tools/seo.py
"""
import json, os, re, html, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, '..', 'website')
BASE = 'https://www.liveeze.com'
TODAY = datetime.date.today().isoformat()
data = json.load(open(os.path.join(HERE, 'portfolio.json')))

from build_portfolio import CATS, ALT  # noqa: E402  (same collection names as the pages)

ORG = f'{BASE}/#organization'
SITE_ID = f'{BASE}/#website'
EMAIL = 'info@liveeze.com'
DESC = ('LIVEEZE is a full-service interior architecture, design and build studio for residential and '
        'commercial spaces, from first sketch to final key.')

SERVICES = [
    ('Interior architecture', 'Layouts, ceilings, walls, joinery and the flow between rooms.'),
    ('Exterior and interior 3D visualisation', 'Photorealistic views of a space before any work begins.'),
    ('Furniture layout', 'Each room arranged around how it will be used, with easy circulation.'),
    ('Furniture design and development', 'Bespoke pieces made for the space, from TV units to wardrobes.'),
    ('Lighting design', 'Layered ambient, task and accent light, including concealed lighting.'),
    ('Material selection', 'Stone, wood, fabric and finishes, sampled and chosen with the client.'),
    ('Landscape planning', 'Gardens, balconies and terraces with planting, paving and outdoor light.'),
    ('Contracting', 'Building what was designed and coordinating every trade on site.'),
    ('Consulting', 'Expert advice on a plan, a purchase or a renovation.'),
    ('Turnkey solutions', 'Spaces designed, built, furnished and ready to move into.'),
]


def org():
    return {
        '@type': 'Organization', '@id': ORG, 'name': 'LIVEEZE', 'url': f'{BASE}/',
        'logo': {'@type': 'ImageObject', '@id': f'{BASE}/#logo', 'url': f'{BASE}/assets/icons/icon-512.png', 'width': 512, 'height': 512, 'caption': 'LIVEEZE'},
        'image': {'@id': f'{BASE}/#logo'}, 'email': EMAIL, 'slogan': 'Live exquisitely.', 'description': DESC,
    }


def website():
    return {'@type': 'WebSite', '@id': SITE_ID, 'url': f'{BASE}/', 'name': 'LIVEEZE', 'description': 'Interior architecture, design and build, under one roof.',
            'publisher': {'@id': ORG}, 'inLanguage': 'en'}


def business():
    return {
        '@type': 'ProfessionalService', '@id': f'{BASE}/#business', 'name': 'LIVEEZE', 'url': f'{BASE}/',
        'image': f'{BASE}/assets/og-image.jpg', 'logo': {'@id': f'{BASE}/#logo'}, 'email': EMAIL,
        'description': DESC, 'slogan': 'Live exquisitely.', 'parentOrganization': {'@id': ORG},
        'knowsAbout': [s[0] for s in SERVICES] + ['Residential interior design', 'Commercial interior design', 'Hospitality design', 'Office design'],
        'hasOfferCatalog': {
            '@type': 'OfferCatalog', 'name': 'Design and build services',
            'itemListElement': [{'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': n, 'description': d, 'provider': {'@id': ORG}}} for n, d in SERVICES],
        },
    }


def breadcrumbs(page_url, trail):
    return {'@type': 'BreadcrumbList', '@id': f'{page_url}#breadcrumb',
            'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(trail)]}


def faq_from_html(src):
    items = re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', src, re.S)
    clean = lambda t: html.unescape(re.sub(r'<[^>]+>', '', t)).strip()
    return {'@type': 'FAQPage', '@id': f'{BASE}/#faq', 'mainEntity': [
        {'@type': 'Question', 'name': clean(q), 'acceptedAnswer': {'@type': 'Answer', 'text': clean(a)}} for q, a in items]}


def ld(graph):
    return '<!-- SCHEMA:START -->\n<script type="application/ld+json">\n' + json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=1) + '\n</script>\n<!-- SCHEMA:END -->'


def inject(path, block):
    s = open(path).read()
    if '<!-- SCHEMA:START -->' in s:
        s = re.sub(r'<!-- SCHEMA:START -->.*?<!-- SCHEMA:END -->', lambda m: block, s, flags=re.S)
    else:
        s = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', '', s, flags=re.S)
        s = s.replace('</head>', block + '\n</head>', 1)
    if 'name="robots"' not in s:
        s = s.replace('<meta name="theme-color"', '<meta name="robots" content="index, follow, max-image-preview:large">\n<meta name="theme-color"', 1)
    open(path, 'w').write(s)


# ---------- Home ----------
home = os.path.join(SITE, 'index.html')
home_src = open(home).read()
inject(home, ld([
    org(), website(), business(),
    {'@type': 'WebPage', '@id': f'{BASE}/#webpage', 'url': f'{BASE}/', 'name': 'LIVEEZE · Interior Architecture, Design & Build',
     'description': DESC, 'isPartOf': {'@id': SITE_ID}, 'about': {'@id': ORG}, 'inLanguage': 'en',
     'primaryImageOfPage': {'@type': 'ImageObject', 'url': f'{BASE}/assets/og-image.jpg', 'width': 1200, 'height': 630}},
    faq_from_html(home_src),
]))

# ---------- Portfolio ----------
pf_url = f'{BASE}/portfolio'
galleries = []
for cat, name, group, blurb in CATS:
    imgs = data[cat]
    galleries.append({
        '@type': 'ImageGallery', '@id': f'{pf_url}#{cat}', 'name': name, 'description': blurb, 'url': f'{pf_url}#{cat}',
        'numberOfItems': len(imgs), 'creator': {'@id': ORG},
        'image': [{'@type': 'ImageObject', 'contentUrl': f'{BASE}/{it["src"]}', 'thumbnailUrl': f'{BASE}/{it["thumb"]}',
                   'name': f'{ALT[cat]} by LIVEEZE, {i:02d}', 'creator': {'@id': ORG}, 'creditText': 'LIVEEZE',
                   'copyrightHolder': {'@id': ORG}} for i, it in enumerate(imgs, 1)],
    })
total = sum(len(data[c]) for c, *_ in CATS)
inject(os.path.join(SITE, 'portfolio.html'), ld([
    org(), website(),
    {'@type': 'CollectionPage', '@id': f'{pf_url}#webpage', 'url': pf_url, 'name': 'Portfolio · LIVEEZE',
     'description': f'{total} interior and exterior designs across twelve collections by LIVEEZE.',
     'isPartOf': {'@id': SITE_ID}, 'about': {'@id': ORG}, 'inLanguage': 'en', 'breadcrumb': {'@id': f'{pf_url}#breadcrumb'},
     'primaryImageOfPage': {'@type': 'ImageObject', 'url': f'{BASE}/assets/og-portfolio.jpg', 'width': 1200, 'height': 630},
     'hasPart': [{'@id': g['@id']} for g in galleries]},
    breadcrumbs(pf_url, [('Home', f'{BASE}/'), ('Portfolio', pf_url)]),
    *galleries,
]))

# ---------- Privacy ----------
pv_url = f'{BASE}/privacy'
inject(os.path.join(SITE, 'privacy.html'), ld([
    org(), website(),
    {'@type': 'WebPage', '@id': f'{pv_url}#webpage', 'url': pv_url, 'name': 'Privacy · LIVEEZE', 'isPartOf': {'@id': SITE_ID},
     'inLanguage': 'en', 'breadcrumb': {'@id': f'{pv_url}#breadcrumb'}},
    breadcrumbs(pv_url, [('Home', f'{BASE}/'), ('Privacy', pv_url)]),
]))
pv = open(os.path.join(SITE, 'privacy.html')).read()
if 'rel="canonical"' not in pv:
    pv = pv.replace('<title>', f'<link rel="canonical" href="{pv_url}">\n<title>', 1)
    open(os.path.join(SITE, 'privacy.html'), 'w').write(pv)

# ---------- Project: Marhaba Manzil ----------
MM = json.load(open(os.path.join(HERE, 'marhaba.json')))
pj_url = f'{BASE}/projects/marhaba-manzil'
pj_imgs = [(f'{BASE}{it["src"]}', f'Marhaba Manzil, {g["title"].lower()}: {it["caption"]}') for g in MM for it in g['items']]
pj_imgs += [(f'{BASE}/assets/projects/marhaba-manzil/plan-ground.png', 'Marhaba Manzil ground floor plan'),
            (f'{BASE}/assets/projects/marhaba-manzil/plan-first.png', 'Marhaba Manzil first floor plan')]
video = {'@type': 'VideoObject', '@id': f'{pj_url}#film', 'name': 'Marhaba Manzil, 3D walkthrough film',
         'description': 'The whole home in one 3D film, from the gate to the courtyard and every room.',
         'thumbnailUrl': f'{BASE}/assets/projects/marhaba-manzil/film-poster.jpg',
         'contentUrl': f'{BASE}/assets/projects/marhaba-manzil/film.mp4', 'uploadDate': '2026-11-25T12:00:00+04:00',
         'duration': 'PT3M30S', 'creator': {'@id': ORG}, 'publisher': {'@id': ORG}}
house = {'@type': 'CreativeWork', '@id': f'{pj_url}#project', 'name': 'Marhaba Manzil',
         'description': 'Two-storey residential villa around an open-to-sky courtyard in Ishwaramangala, Puttur, Dakshina Kannada: 7 bedrooms, 8 baths and toilets, about 3,400 sq ft built-up.',
         'creator': {'@id': ORG}, 'genre': 'Residential architecture and interior design', 'url': pj_url,
         'image': f'{BASE}{MM[0]["items"][0]["src"]}', 'sameAs': 'https://marhabamanzil.vercel.app/',
         'locationCreated': {'@type': 'Place', 'name': 'Ishwaramangala, Puttur, Dakshina Kannada, Karnataka, India'},
         'about': {'@type': 'House', 'name': 'Marhaba Manzil', 'numberOfRooms': 7, 'numberOfBedrooms': 7, 'numberOfBathroomsTotal': 8,
                   'floorSize': {'@type': 'QuantitativeValue', 'value': 3400, 'unitCode': 'FTK'}},
         'hasPart': [{'@id': f'{pj_url}#{g["key"]}'} for g in MM] + [{'@id': f'{pj_url}#film'}]}
pj_galleries = [{'@type': 'ImageGallery', '@id': f'{pj_url}#{g["key"]}', 'name': f'Marhaba Manzil: {g["title"]}', 'numberOfItems': len(g['items']),
                 'image': [{'@type': 'ImageObject', 'contentUrl': f'{BASE}{it["src"]}', 'name': it['caption'], 'creator': {'@id': ORG}, 'creditText': 'LIVEEZE'} for it in g['items']]}
                for g in MM]
inject(os.path.join(SITE, 'projects', 'marhaba-manzil.html'), ld([
    org(), website(),
    {'@type': 'WebPage', '@id': f'{pj_url}#webpage', 'url': pj_url, 'name': 'Marhaba Manzil · Residential Villa Project · LIVEEZE',
     'isPartOf': {'@id': SITE_ID}, 'about': {'@id': f'{pj_url}#project'}, 'inLanguage': 'en', 'breadcrumb': {'@id': f'{pj_url}#breadcrumb'},
     'primaryImageOfPage': {'@type': 'ImageObject', 'url': f'{BASE}/assets/og-marhaba.jpg', 'width': 1200, 'height': 630}},
    breadcrumbs(pj_url, [('Home', f'{BASE}/'), ('Projects', f'{BASE}/#projects'), ('Marhaba Manzil', pj_url)]),
    house, video, *pj_galleries,
]))

# ---------- Sitemap with images ----------
def img(loc, title):
    return f'    <image:image><image:loc>{loc}</image:loc><image:title>{html.escape(title)}</image:title></image:image>'

home_imgs = [img(f'{BASE}/assets/images/{f}', t) for f, t in [
    ('hero-staircase.jpg', 'Curved forest-green staircase lit by a skylight'),
    ('ivory-architecture.jpg', 'Ivory plaster courtyard with an olive tree'),
    ('natural-materials.jpg', 'Travertine, green marble, oak and linen samples'),
    ('courtyard-living.jpg', 'Courtyard living room in warm evening light'),
]]
pf_imgs = [img(f'{BASE}/{it["src"]}', f'{ALT[c]} by LIVEEZE, {i:02d}') for c, *_ in CATS for i, it in enumerate(data[c], 1)]
sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
      f'  <url>\n    <loc>{BASE}/</loc>\n    <lastmod>{TODAY}</lastmod>\n' + '\n'.join(home_imgs) + '\n  </url>',
      f'  <url>\n    <loc>{pf_url}</loc>\n    <lastmod>{TODAY}</lastmod>\n' + '\n'.join(pf_imgs) + '\n  </url>',
      f'  <url>\n    <loc>{pj_url}</loc>\n    <lastmod>{TODAY}</lastmod>\n' + '\n'.join(img(u, t) for u, t in pj_imgs) + f'\n    <video:video><video:thumbnail_loc>{BASE}/assets/projects/marhaba-manzil/film-poster.jpg</video:thumbnail_loc><video:title>Marhaba Manzil, 3D walkthrough film</video:title><video:description>The whole home in one 3D film, from the gate to the courtyard and every room.</video:description><video:content_loc>{BASE}/assets/projects/marhaba-manzil/film.mp4</video:content_loc><video:duration>210</video:duration></video:video>\n  </url>',
      f'  <url>\n    <loc>{pv_url}</loc>\n    <lastmod>{TODAY}</lastmod>\n  </url>',
      '</urlset>', '']
open(os.path.join(SITE, 'sitemap.xml'), 'w').write('\n'.join(sm))
print('schema + sitemap written;', total, 'portfolio images')
