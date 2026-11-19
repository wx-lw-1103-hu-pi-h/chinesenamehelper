# Chinese Name Helper

A Chinese name generator that is actually a naming tool, not a transliterator.
Enter a birthday and a few words about yourself; the site reads the lunar date,
the zodiac and the eight characters, works out which of the five elements your
chart is short of, then chooses two characters that fit — with pinyin, meaning,
the classical line each character comes from, a calligraphy signature in four
hands, an animated stroke order, and a printable name card.

Domain target: **chinesenamehelper.com**

## What is here

```
site/                          the deployable site — upload this directory
  index.html                   name generator (the flagship page)
  my-name-in-chinese/          landing page for "my name in chinese"
  hanzi-to-pinyin/             converter with tone marks and polyphone handling
  stroke-order/                stroke order animator + printable worksheet
  characters/                  the character library index (120 characters)
  character/<字>/              one static page per character (120 pages)
  sitemap.xml                  125 URLs, generated
  robots.txt
  assets/
    css/main.css               the whole design system
    data/characters.js         character records: pinyin, meaning, source, note
    data/characters2.js        more records
    lib/lunar.js               solar → lunar → bazi (435 KB)
    lib/hanzi-writer.min.js    stroke animation engine
    lib/pinyin-pro.min.js      ~50k character dictionary with polyphones
    hanzi-data/<字>.json       122 stroke datasets (Make Me a Hanzi)
    js/engine.js               the naming engine
    js/app.js                  page controller
    js/signature.js            canvas calligraphy
    js/pinyin.js               ruby layout over pinyin-pro
    js/stroke.js               stroke page controller
```

Everything is static. No build step, no bundler, no framework, no runtime
dependency on a third party — every library is vendored and every stroke dataset
is shipped. Upload `site/` to any static host and it works.

## The naming engine

`assets/js/engine.js` is the part worth reading.

- **Deterministic.** `mulberry32(seed)` means the same inputs always give the
  same names, so a result can be encoded in a URL and shared. `?s=王&g=male&y=1994&m=1&d=27&q=calm&n=3&a=…`
  restores exactly the batch the sharer saw.
- **Birth data is real.** solar → lunar → zodiac → four pillars, then the five
  element counts across the eight characters. The weakest element guides
  character choice.
- **Quality filters.** `ATTESTED` (680+ pairings that are real names) adds
  weight; `BLOCKED` (通信, 大学, 风雨 …) subtracts heavily. This is what stops
  the output reading like two random words.
- **Exploration.** `avoid` carries every name already shown. Candidates are
  drawn from the whole library, and a character costs 6 points per earlier
  appearance (capped at four appearances), so unseen glyphs win by default while
  name quality still decides between two unseen pairs. Forty consecutive draws
  give 200 distinct names with no repeats, and a name from the first screen does
  not come back later in the visit.
- **One number per name.** `fitOf()` decomposes a name into element fit, meaning
  match, sound and gender, then isotonic regression forces the display order to
  agree with the ranking — the ring never says something the rank contradicts.

## The visual system

Ink on paper, lit from the side. `assets/css/main.css` is the single source; the
generated pages carry only page-specific rules.

- **Two ink bands.** The header and the footer are the same near-black
  (`#15110e` → `#2a1b13`), so the page opens and closes on one note. Everything
  between them is paper.
- **One gesture.** A card that matters breaks out of the band above it: a
  3px cinnabar→gold→jade rule on its top edge, 20–22px radius, a deep upward
  shadow. `-58px` (form card), `-46px` (tool and index sheets, loosened on
  narrow screens so it never bites the hero copy).
- **The band is not flat.** A masked practice grid, three colour washes and a
  large low-contrast glyph drawn from `data-mark` — no extra request, one
  attribute per page.
- **Colour carries meaning.** Cinnabar points, gold names, jade scores. The four
  feature cards cycle through cinnabar / gold / jade / indigo so they read as
  four cards rather than four paragraphs.
- **Contrast floors.** Small text sits at 4.5:1 or better on its own ground;
  large text at 3:1. Decorative marks (the corner practice plate, the empty-state
  glyph) are tuned to be visible but not loud; anything that must be *read* is
  measured, not eyeballed.
- **The library is grouped.** `/characters/` lists by element in the order the
  five are always recited — 木 火 土 金 水 — because 120 identical cards in one
  column is a wall, not a catalogue.
- **Print is its own stylesheet.** `@media print` hides the bands and the tool
  chrome, but the character page puts its band back as black-on-white: the glyph
  and its plate are the whole reason to print that page.

## Regenerating the static parts

After editing `characters.js` or `characters2.js`:

```bash
node _gen_chars.cjs      # 120 character pages + the library index
node _gen_gifts.cjs      # carrier pages
node _gen_home.cjs       # the four home pages
node _unify_nav.cjs      # identical navigation on every page
node _gen_sitemap.cjs    # sitemap.xml + robots.txt from pages that exist
```

The header nav and the footer's tools column are built by `_nav.cjs` for every
generator. It is the only place that decides whether a link needs
`hreflang="en"` and a visible `EN` marker — those appear on the translated
locales for the three English-only prose pages, and nowhere else. Six copies of
the same six anchors is how the marker ended up on the homes and missing from
396 section pages.

## Verifying locally

```bash
node _serve.cjs 8777     # http://127.0.0.1:8777
node _crawl.cjs          # every route: status, title, description, canonical, h1, JSON-LD, dead links
node _check_engine.cjs   # engine: determinism, uniqueness, avoid, fit range, generation quality
node _check_url.cjs      # a shared link reproduces the exact batch it encodes
```

## Notes

- Stroke data is from the Make Me a Hanzi dataset (Arphic Public License) and is
  attributed in the page footers.
- The site is English-first because the search demand is: `chinese name
  generator`, `my name in chinese`, `chinese stroke order`, `chinese hanzi to
  pinyin`. The domain uses *chinese name* to match the head query; the titles use
  *generator* because that is what people actually type.
- The origin lives in one place: `ORIGIN` in `_i18n/index.cjs`. Every canonical,
  hreflang, sitemap entry and footer link is built from it, so a domain move is a
  one-line change plus re-running the generators.
- Characters outside the shipped 122 cannot be animated without a network call.
  The page says so rather than silently reaching for a CDN.
