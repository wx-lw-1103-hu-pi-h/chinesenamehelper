/**
 * Carrier copy for English.
 *
 * One object per carrier, keyed by the slug in catalog.cjs, plus the strings
 * the hub page needs. Every flagged string is escaped by the generator; the
 * five fields the generator pastes into JSON-LD are stripped of markers there,
 * so `{bold}` here is only ever emphasis, never data.
 *
 * `which` is the block that earns the page. It is not a restatement of the
 * product photo — it says which characters survive on this carrier and why,
 * using the stroke counts from the character library. A reader who knows their
 * name is 曦 learns here that a 20-stroke character will not read on a 12 mm
 * seal, which is advice no generic gift page can give.
 */
module.exports = {
  /* ---------- hub page ---------- */
  'hub.title': 'Put Your Chinese Name on Something Real — Seal, Pendant, Tea Set, Fan',
  'hub.desc': 'Your Chinese name is chosen: now put it on something. Seals, pendants, teaware, fans, stationery, apparel, plush and display bases, with guidance on which characters stay legible on each.',
  'hub.ogtitle': 'Chinese name gifts: seal, pendant, tea set, fan',
  'hub.ogdesc': 'Which characters survive at seal size, and which need a scroll. A guide to turning a chosen Chinese name into a physical object.',
  'hub.eyebrow': 'Name · Gift',
  'hub.h1a': 'Your name, on something',
  'hub.h1b': 'you keep',
  'hub.sub': 'A Chinese name is a design, not just a label. These are the objects people actually put one on — and what each object demands of the characters you chose.',
  'hub.note': 'Every carrier below is judged by the same test: {bold}can the character still be read at that size?{/bold} That is why a seal page and a scroll page recommend different names from the same library.',
  'hub.pick.head': 'Start from what you have',
  'hub.pick.body': 'If you have not chosen a name yet, generate one first — every page here assumes you already know which characters you want worked into the object.',
  'hub.pick.cta': 'Generate your Chinese name',
  'hub.more.head': 'On choosing a carrier',
  'hub.more.p1': 'The seal is the oldest and the most Chinese of these: a carved stamp that turns a name into a signature. It is also the least forgiving, because a stone the size of a thumbnail has to hold the whole name.',
  'hub.more.p2': 'The pendant, the fan and the scroll each buy back room in a different direction — depth on a neck, height on a leaf, area on paper. That is the whole trade-off, and it is why this site sorts carriers by how many strokes they tolerate rather than by price.',
  'hub.more.p3': 'Nothing here is sold directly. These pages describe what works and what does not; the enquiry form on each one puts you in touch about a specific piece.',

  /* ---------- enquiry form ---------- */
  'form.head': 'Ask about this piece',
  'form.lead': 'Tell us which carrier, which name, and what you have in mind. The button opens a pre-filled email in your own mail app — nothing is submitted from this page.',
  'form.name': 'Your name',
  'form.email': 'Your email',
  'form.carrier': 'What you are interested in',
  'form.chinese': 'Your Chinese name (if you have one)',
  'form.message': 'Anything else',
  'form.messageph': 'Size, material, deadline, or a reference photo you liked',
  'form.send': 'Open pre-filled email',
  'form.fallback': 'Prefer to write directly?',
  'form.note': 'Sending opens your email app with the details already filled in. You can edit it before it goes.',

  /* ---------- carrier pages ---------- */
  seal: {
    title: 'Chinese Name Seal — Which Characters Survive at Stamp Size',
    desc: 'A Chinese name seal carved in stone or wood: how many characters fit, which stroke counts stay legible at 15 mm, and why layout is carved vertically.',
    name: 'Name seal',
    h1a: 'A seal turns your name into',
    h1b: 'a signature',
    sub: 'The oldest carrier on this site, and the one with the tightest rules. A stone the size of a thumbnail has to hold the whole name, and a character that reads clearly on paper will not necessarily read here.',
    layout: 'Why the characters are carved top to bottom: a seal is stamped, not written, and the eye reads the impression the way it reads a column of text. Horizontal carving in a small stone compresses each character sideways, which is the failure mode you see in cheap souvenir seals.',
    which: 'Two characters at 10 strokes or fewer hold up at 15 mm. That covers much of the library — 明, 安, 宁, 和 — but rules out the showy ones. 曦 at 20 strokes becomes a dense black square once the stone is small; if that is your name, this carrier is asking for a larger stone rather than a different name.',
    qualify: 'A seal is also the one carrier where your surname matters more than usual: three characters carved three strokes deep in a small stone have to be laid out before anything is cut.',
    blurb: 'Two characters at ten strokes or fewer still read at stamp size. Anything denser needs a bigger stone, not a different name.',
    aside: 'Stamped, not written'
  },
  jewelry: {
    title: 'Chinese Name Pendant — One or Two Characters, Worn Every Day',
    desc: 'A necklace or charm carrying your Chinese name: why one character reads best at pendant size, which stroke counts suit engraving on metal and jade, and how skin contact affects the choice.',
    name: 'Pendant',
    h1a: 'One character, worn',
    h1b: 'close',
    sub: 'A pendant is read at arm’s length by someone standing near you, which makes it the narrowest carrier here — and the one where a single well-chosen character outperforms a full name.',
    layout: 'A single character is set centred with generous space around it. This is not a stylistic preference: a pendant is a small object seen at an angle, and a character that fills the disc leaves no edge for the eye to complete the shape.',
    which: 'Up to 12 strokes engrave cleanly on a metal disc or a jade drop. Above that the strokes crowd into each other at pendant scale, and a name like 澜 or 曦 is better served by a wider carrier. One character also lets the name carry meaning without explanation — 静 reads as calm before anyone asks what it means.',
    qualify: 'Metal and jade are engraved, not printed, so the reverse side of the disc matters: a two-sided pendant can carry the full name on the back while the front holds the single character.',
    blurb: 'One well-chosen character reads better than a crowded full name, because a pendant is read at arm’s length.',
    aside: 'Skin contact, daily wear'
  },
  tea: {
    title: 'Chinese Name on a Tea Set — Cup, Pot and Tea Scoop',
    desc: 'Your Chinese name on teaware: how many characters fit a cup wall, why glaze and firing decide where the name can go, and which stroke counts suit hand-thrown pieces.',
    name: 'Tea set',
    h1a: 'A name on the cup',
    h1b: 'you use',
    sub: 'Teaware is held in the hand, which buys back the room a seal does not have. A cup wall or a tea scoop takes two characters comfortably and three at a pinch.',
    layout: 'The name sits on the vertical face of the cup, not around the rim: a curved inscription loses its first and last character to the curve. On a scoop or a caddy lid it lies flat along the length, which is the easiest surface of any carrier here.',
    which: 'Up to 16 strokes work on a hand-thrown cup, because the surface is large enough to give dense characters room. This is the carrier where the library’s more elaborate characters — 澜, 霖, 霜 — stop being a problem.',
    qualify: 'Glaze matters more than size. An unglazed clay body takes a carved or pressed name that survives firing; a glazed cup needs the name added as a decal or a brush-written mark under the glaze, which changes what the finished piece can look like.',
    blurb: 'A cup wall gives two characters room, and a hand-thrown body takes dense strokes a seal would smudge.',
    aside: 'Held in the hand'
  },
  stationery: {
    title: 'Chinese Name on a Scroll, Notebook or Bookplate',
    desc: 'Your name written on paper and mounted: why scrolls carry the longest names, how a bookplate differs from a seal, and which characters suit brush-written mounting.',
    name: 'Scroll and paper',
    h1a: 'Paper has no',
    h1b: 'size limit',
    sub: 'This is where the dense characters belong. A mounted scroll, a notebook cover or a bookplate gives the name the area it needs, so the choice stops being about legibility and starts being about composition.',
    layout: 'Vertical, top to bottom, right to left — the direction a Chinese column has always run. On a notebook cover the name can run horizontally, but a scroll that is read horizontally reads as decoration rather than as writing.',
    which: 'All 20 strokes work here. 曦, 馥 and 澜 are at their best on paper, and this is the only carrier where a three-character name has room to breathe rather than being stacked.',
    qualify: 'The paper is the constraint, not the character. A scroll is mounted on silk or paper and rolled, so a name brushed on thin stock will crack at the fold; the mounting has to be planned before the writing happens.',
    blurb: 'Paper is the one carrier with no size limit, so a 20-stroke character finally has room to be itself.',
    aside: 'Brush and mounting'
  },
  fan: {
    title: 'Chinese Name on a Folding Fan — The Vertical Carrier',
    desc: 'Your name painted along the leaf of a folding or round fan: how an arc changes layout, how many characters fit, and why the fan is the Chinese answer to a ceremonial inscription.',
    name: 'Folding fan',
    h1a: 'A column of characters',
    h1b: 'on an arc',
    sub: 'The fan is the carrier people reach for when they want height rather than width — a leaf gives a column of characters room to stand up, in a form that has carried inscriptions for centuries.',
    layout: 'The inscription runs along the arc, following the leaf rather than the page. Laying it straight on a mounted fan is the mistake that makes a fan look printed rather than painted.',
    which: 'Four characters at 18 strokes or fewer sit along a leaf without crowding, which makes the fan the most generous carrier for a full name short of paper. A single character looks lost on a leaf; this is a carrier for two to four.',
    qualify: 'A folding fan is only inscribed on one side, and the ribs pass behind the paper — the writing has to be planned around the folds, not applied and then discovered to cross them.',
    blurb: 'A fan gives the name height along the arc instead of width, which is what a long vertical column needs.',
    aside: 'Height, not width'
  },
  daily: {
    title: 'Chinese Name on a Mug, Water Bottle or Phone Case',
    desc: 'Everyday objects carrying your Chinese name: why a printed surface behaves differently from an engraved one, which stroke counts stay sharp, and what wear does to thin strokes.',
    name: 'Mug and bottle',
    h1a: 'The objects you',
    h1b: 'touch daily',
    sub: 'A mug, a bottle, a phone case: the carriers with the most use and the least ceremony. Print and engraving both work here, and both fail in different ways.',
    layout: 'Horizontal, reading left to right, because these objects are handled in a Western orientation even when the name is Chinese. A vertical column wraps around the curve on a bottle and disappears.',
    which: 'Up to 14 strokes stay sharp under print. Engraving on a bottle or a case cuts a fixed depth regardless of stroke width, so very fine strokes can fill in or flake at the edges over years of handling.',
    qualify: 'Dishwasher and pocket abrasion are the real test. A name printed on a mug that goes through a dishwasher weekly will fade faster than the same name engraved, and thin horizontal strokes are the first to go.',
    blurb: 'Print and engraving age differently on something used every day, and thin horizontal strokes go first.',
    aside: 'Print versus engraving'
  },
  wear: {
    title: 'Chinese Name on Apparel — T-Shirt, Cap, Tote, Scarf',
    desc: 'Your Chinese name printed or embroidered on clothing and fabric: why embroidery distorts diagonal strokes, how many characters fit a chest print, and what fabric does to detail.',
    name: 'Apparel',
    h1a: 'Worn on the',
    h1b: 'body',
    sub: 'Fabric takes the largest names of any carrier here — three characters sit comfortably across a chest — and it also changes the character itself, because thread and ink do not draw a stroke the same way.',
    layout: 'Horizontal across the chest or the panel, because a garment is read while facing the wearer. A vertical column on a tote works; a vertical column on a chest reads as a stripe rather than as writing.',
    which: 'Three characters at 18 strokes or fewer work in print. Embroidery is stricter: the needle moves in fixed directions, so long diagonals and thin horizontals distort, and a character built from them — 必, 之 — can emerge unrecognisable at small scale.',
    qualify: 'The fabric weight decides the detail. A heavy cotton tee holds a clean print; a lightweight scarf or a knit cap loses fine strokes to the weave, so the name has to be simplified rather than shrunk.',
    blurb: 'Fabric takes three characters across a chest, but thread moves in fixed directions and bends the diagonals.',
    aside: 'Thread and ink'
  },
  plush: {
    title: 'Chinese Name on a Plush Toy or Cushion',
    desc: 'A plush or cushion embroidered with your Chinese name: why a single character suits a soft body, how embroidery direction affects the strokes, and what stuffing does to a stitched line.',
    name: 'Plush toy',
    h1a: 'Soft, and still',
    h1b: 'readable',
    sub: 'A plush is the carrier with the most personality and the least surface discipline. One character, embroidered large, survives the softness better than a full name stitched small.',
    layout: 'A single character, centred on a flat panel — a paw pad, a belly patch, a cushion face. Curved surfaces pull the stitch line as the toy is stuffed, so the panel has to be embroidered before it is sewn in, not after.',
    which: 'Up to 14 strokes embroider cleanly. Diagonals soften on a stuffed body because the filling pushes the fabric outward, so squarer characters hold their shape better than sprawling ones.',
    qualify: 'This is the carrier where safety and materials matter most: a plush intended for a child is subject to toy safety rules in most markets, and the embroidery thread is part of that assessment, not an afterthought.',
    blurb: 'One character stitched large on a flat panel survives a soft body; a full name sewn small does not.',
    aside: 'Soft surfaces'
  },
  figure: {
    title: 'Chinese Name on a Display Base — Figurine, Model, Stand',
    desc: 'A name etched on the base of a figurine, model or stand: why the base plate is read from above, which stroke counts stay crisp when etched, and how a name personalises a display piece.',
    name: 'Display base',
    h1a: 'The base is',
    h1b: 'the signature',
    sub: 'A display base is read from above and at a glance, which makes it the carrier closest in spirit to a seal: a small marked surface that says whose the piece is.',
    layout: 'Horizontal along the front edge of the plate, where the eye lands when the piece is viewed head-on. On a stand that is seen from all sides, the name belongs on the face the piece is normally displayed toward.',
    which: 'Two characters at 12 strokes or fewer etch crisply on a metal or acrylic plate. Denser characters work if the plate is large, but a base is usually sized to the figure rather than to the inscription.',
    qualify: 'A generic base personalises any figure; a base shaped for a specific character or logo raises a separate question about the rights to that design. If the piece is a licensed character, the inscription is the only part that can be freely customised.',
    blurb: 'The base is read at a glance from above, so the inscription stays short and the plate stays small.',
    aside: 'Read from above'
  },

  /* ---------- shared labels ---------- */
  'label.which': 'Which characters work here',
  'label.layout': 'Why it is laid out this way',
  'label.qualify': 'Before you commit',
  'label.samples': 'Characters that suit this carrier',
  'label.more': 'Other gifts',
  'label.all': 'All gifts',
  'label.view': 'Read the guide',
  'label.crumb': 'Gifts',
  'label.placeholder': 'Illustration, not the finished piece',
  'nav.gifts': 'Gifts',

  /* Kept for the sample grid: the reason a character was picked, in words the
     page can print without exposing the stroke arithmetic. */
  'fit.short': 'Stays legible at this size',
  'fit.deep': 'Needs a larger surface',
  'fit.charslabel': 'Characters',
  'fit.strokeslabel': 'Stroke limit',
  'fit.layoutlabel': 'Layout',
  'fit.layout.vertical': 'vertical',
  'fit.layout.horizontal': 'horizontal',
  'fit.layout.single': 'single',
  'fit.rule': 'These characters are {strokes} strokes or fewer, so they hold at this size.',
  'fit.deepnote': 'And these are above {strokes}: on this carrier they would fill in rather than read.',

  /* ---------- customiser (the workshop panel) ---------- */
  'cw.eyebrow': 'Workshop',
  'cw.head': 'Cut it yourself',
  'cw.lead': 'Not every order starts from a name we generated. Type your own characters, leave the face bare, or send a picture to be pressed in as a seal mark. The preview is drawn at the carrier’s real engraving position, at the size it will be cut.',
  'cw.mode.name': 'Your characters',
  'cw.mode.none': 'Leave it bare',
  'cw.mode.motif': 'Your image',
  'cw.name.label': 'What to cut',
  'cw.name.ph': 'Up to {n} characters',
  'cw.name.hint': 'Up to {n} characters here, set {layout} the way the sample on the drawing is. Long names are set smaller rather than run off the object.',
  'cw.count': '{n} / {max}',
  'cw.none.hint': 'The object ships with nothing cut into it. Some buyers want the bare stone, the blank scroll or the plain cup and have it cut at home; that is a real order and it costs the same.',
  'cw.motif.hint': 'A picture is not printed onto the surface. It is reduced to one colour and cut in that shape, the way a seal prints. Line drawings, monograms and hard silhouettes survive; photographs lose their detail, and the preview shows exactly what survives.',
  'cw.motif.pick': 'Choose a picture',
  'cw.motif.drop': 'or drop one here',
  'cw.motif.thumb': 'The mark we will cut',
  'cw.motif.err.type': 'That file is not an image this browser can read. Use PNG, JPG, GIF or SVG.',
  'cw.motif.err.size': 'That image is too large. Keep it under 8 MB.',
  'cw.motif.err.empty': 'Nothing dark enough to press. Try an image with more contrast.',
  'cw.proof': 'Proof',
  'cw.download': 'Download the proof',
  'cw.confirm': 'Send this to the enquiry form',
  'cw.tip': 'A drawing, not a photograph of the finished piece. Colour and grain vary with the material.'
};
