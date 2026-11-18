/**
 * Illustrations for the carriers, drawn as SVG.
 *
 * No photographs and no AI-rendered mock-ups, for a reason: the entire point of
 * a carrier page is the question "does the character still read at this size?"
 * Even so, the first version of these drawings was too thin to answer it. They
 * were a 1.6px outline on flat cream with a centred 明 dropped into the middle:
 * every object was drawn from the same elevation, with no material, no shadow
 * and no perspective, so ten different carriers looked like ten copies of one
 * diagram. At thumb size the character read as a label stuck on a box, not as
 * something incised into an object.
 *
 * What changed, and why:
 *
 *   - Light now comes from one place (upper left) and every object casts a
 *     shadow away from it. A shadow is what separates a drawing from a diagram.
 *   - Materials are told apart by the way they hold light, not by colour: stone
 *     is matte with a chipped highlight, wood is warm with grain, glaze is
 *     glossy with a specular streak, cloth is flat with a soft fold, metal is
 *     cool with a hard bright edge.
 *   - The character is cut or grown into the object rather than floated on top:
 *     it sits in a recess with a shadow on one side and a lit lip on the other,
 *     which is the difference between engraved and pasted.
 *   - Composition is off-centre and slightly oblique. A centred glyph on a
 *     centred object is the visual equivalent of a bulleted list.
 *
 * The sample is still 明 — eight strokes, unambiguous at every size here, so
 * the illustration never looks broken because the sample was a bad one.
 *
 * One file per carrier at site/assets/img/gifts/<slug>.svg, written by
 * _gen_gifts.cjs.
 */

const SAMPLE = '明';

/* Set by the generator when writing a blank plate for the configurator.
   When true, cut()/print() keep their geometry but emit no ink: the object is
   drawn complete, with an empty space exactly where a name would be cut. */
let BLANK = false;
function setBlank(v) { BLANK = !!v; }
/* The generator writes blank plates in a separate node process with BLANK=1,
   because ART is evaluated once at require time. */
if (process.env.BLANK === '1') BLANK = true;

const LINE = '#b3c9bd';
const CREAM = '#fbfefb';
const WARM = '#dfe9e1';
const DEEP = '#d0ded3';
const SHADOW = '#8fa89b';

/* One sheet of soft shadow, reused by every scene. A single blurred ellipse is
   enough: the objects are small and the light is diffuse, so anything more
   elaborate would read as noise at thumb size. */
const DEFS =
  '<defs>' +
  '<linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#f6faf7"/><stop offset=".62" stop-color="#eef4ef"/>' +
  '<stop offset="1" stop-color="#dfe9e1"/></linearGradient>' +
  '<radialGradient id="pool" cx=".5" cy=".5" r=".5">' +
  '<stop offset="0" stop-color="#a8bfb1" stop-opacity=".5"/>' +
  '<stop offset="1" stop-color="#a8bfb1" stop-opacity="0"/></radialGradient>' +
  '<linearGradient id="stone" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#fbfffc"/><stop offset=".55" stop-color="#f0f6f1"/>' +
  '<stop offset="1" stop-color="#d3e0d6"/></linearGradient>' +
  '<linearGradient id="glaze" x1="0" y1="0" x2="1" y2="0">' +
  '<stop offset="0" stop-color="#eaf2ec"/><stop offset=".22" stop-color="#fbfffc"/>' +
  '<stop offset=".72" stop-color="#fbfefb"/><stop offset="1" stop-color="#d6e2d8"/></linearGradient>' +
  '<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#f7f3e2"/><stop offset=".45" stop-color="#d9c58a"/>' +
  '<stop offset=".62" stop-color="#fcfaee"/><stop offset="1" stop-color="#c2ab6a"/></linearGradient>' +
  '<linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#fbfefb"/><stop offset="1" stop-color="#dde8df"/></linearGradient>' +
  '<linearGradient id="inkstone" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#40504a"/><stop offset="1" stop-color="#222e2a"/></linearGradient>' +
  '</defs>';

/* Consistent frame: warm paper, no border — the page frame supplies that. */
function frame(inner, label) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="' + label + '">' +
    DEFS +
    '<rect width="400" height="300" fill="url(#pg)"/>' +
    /* A pool of shade under the whole scene, so nothing floats on a blank
       field. Without it the objects sit on the page rather than in it. */
    '<ellipse cx="200" cy="262" rx="150" ry="26" fill="url(#pool)"/>' +
    inner +
    '</svg>';
}

/* The character, engraved rather than printed: the same glyph twice, once as a
   dark copy offset down-right for the recess, once lit on top. `dy` nudges the
   shadow so it follows the same upper-left light as the object shadows. */
function cut(x, y, size, opts) {
  const o = opts || {};
  const fill = o.fill || '#17241f';
  const depth = o.depth == null ? 1.2 : o.depth;
  const fam = 'font-family="Noto Serif SC,Songti SC,STSong,SimSun,serif"';
  const anchor = 'text-anchor="middle" dominant-baseline="central"';
  const glyph = BLANK ? '' : (o.ch || SAMPLE);
  const t = function (f, dx, dy, fs) {
    return '<text x="' + (x + dx) + '" y="' + (y + dy) + '" ' + fam + ' font-size="' + fs + '" ' +
      'fill="' + f + '" ' + anchor + '>' + glyph + '</text>';
  };
  /* On dark grounds the recess is lighter than the field, not darker. */
  if (o.light) {
    return t('rgba(255,255,255,.30)', -depth, -depth, size) + t(fill, 0, 0, size);
  }
  return t(SHADOW, depth, depth, size) + t(fill, 0, 0, size);
}

/* A printed character: sits on the surface, no recess. Used where the name is
   printed rather than cut, and where a shadow would be wrong. */
function print(x, y, size, fill) {
  return '<text x="' + x + '" y="' + y + '" font-family="Noto Serif SC,Songti SC,STSong,SimSun,serif" ' +
    'font-size="' + size + '" fill="' + (fill || '#17241f') + '" text-anchor="middle" ' +
    'dominant-baseline="central">' + (BLANK ? '' : SAMPLE) + '</text>';
}

const ART = {};

/* ------------------------------------------------------------------ seal
   Two halves of one idea: the stone as carved, and the impression it leaves.
   The stone is tilted a few degrees so the top face catches light, and the
   impression is shown mid-press against the paper rather than floating beside
   it — that is the moment the object is used. */
ART.seal = frame(
  /* stone, tilted, with a lit top face and a chipped corner */
  '<g transform="rotate(-4 126 168)">' +
    '<rect x="52" y="96" width="150" height="146" rx="10" fill="url(#stone)" ' +
    'stroke="' + LINE + '" stroke-width="1.5"/>' +
    /* top face: the plane you actually look down on */
    '<path d="M52 106 q0 -10 10 -10 l130 0 q10 0 10 10 l0 14 -150 0 z" fill="#fbfffc" opacity=".9"/>' +
    '<path d="M52 120 l150 0" stroke="' + LINE + '" stroke-width="1.1" opacity=".7"/>' +
    /* a shadow down the left wall, away from the upper-left light */
    '<path d="M52 120 l0 112 q0 10 10 10 l10 0 0 -122 z" fill="#c4d4c8" opacity=".55"/>' +
    cut(127, 186, 76, { depth: 1.5 }) +
    '</g>' +
  /* the impression, pressed at a slight angle, red bleeding into the paper */
  '<g transform="rotate(2 300 172)">' +
    '<rect x="252" y="122" width="100" height="100" rx="5" fill="#a8392a"/>' +
    '<rect x="252" y="122" width="100" height="100" rx="5" fill="none" stroke="#8d2e21" ' +
    'stroke-width="1" opacity=".5"/>' +
    /* uneven ink at the edges: a stamp never presses flat */
    '<path d="M252 130 q50 5 100 0 l0 -8 -100 0 z" fill="#b8422f" opacity=".55"/>' +
    '<path d="M252 214 q50 -4 100 0 l0 8 -100 0 z" fill="#9c3324" opacity=".5"/>' +
    cut(302, 172, 66, { fill: '#f4fbf6', light: true, depth: 1.4 }) +
    '</g>' +
  /* the red pad under the impression */
  '<ellipse cx="302" cy="238" rx="40" ry="10" fill="#bc4a34" opacity=".7"/>' +
  '<ellipse cx="302" cy="236" rx="40" ry="10" fill="#a8392a" opacity=".45"/>',
  'A carved stone seal and the red impression it leaves'
);

/* --------------------------------------------------------------- jewelry
   The pendant hangs, so the chain is drawn in two segments with a shadow
   behind it, and the disc is a polished metal with a specular sweep. A pendant
   lying flat would not show which way the hole runs. */
ART.jewelry = frame(
  /* the chain: two arcs meeting at the bail, with a soft cast shadow */
  '<path d="M112 22 Q156 66 200 96" fill="none" stroke="#a4bcae" stroke-width="1.4" opacity=".55"/>' +
  '<path d="M288 22 Q244 66 200 96" fill="none" stroke="#a4bcae" stroke-width="1.4" opacity=".55"/>' +
  '<path d="M112 18 Q156 62 200 92" fill="none" stroke="url(#metal)" stroke-width="1.8"/>' +
  '<path d="M288 18 Q244 62 200 92" fill="none" stroke="url(#metal)" stroke-width="1.8"/>' +
  /* bail */
  '<ellipse cx="200" cy="102" rx="7" ry="9" fill="none" stroke="url(#metal)" stroke-width="2.2"/>' +
  /* disc: metal, with a bright sweep across the upper left third */
  '<circle cx="200" cy="186" r="66" fill="url(#metal)" stroke="#b09a5f" stroke-width="1.4"/>' +
  '<circle cx="200" cy="186" r="58" fill="none" stroke="#9d8a55" stroke-width="1.1" opacity=".55"/>' +
  '<path d="M156 148 A66 66 0 0 1 232 126 l0 22 A44 44 0 0 0 174 166 z" fill="#fffdf2" opacity=".75"/>' +
  cut(200, 186, 62, { depth: 1.3 }) +
  /* the shadow the disc throws onto the paper below it */
  '<ellipse cx="208" cy="258" rx="52" ry="9" fill="#8fa89b" opacity=".45"/>',
  'A round pendant engraved with one character'
);

/* -------------------------------------------------------------------- tea
   Side view is the only one that shows both the wall the name goes on and the
   rim it must not wrap around. The cup is glazed so it gets a specular
   highlight down one side and a darker reflected edge down the other. */
ART.tea = frame(
  /* saucer first, so the cup overlaps it */
  '<ellipse cx="200" cy="238" rx="86" ry="16" fill="#e6efe8" stroke="' + LINE + '" stroke-width="1.3"/>' +
  '<ellipse cx="200" cy="234" rx="86" ry="16" fill="url(#glaze)" stroke="' + LINE + '" stroke-width="1.4"/>' +
  /* body */
  '<path d="M118 128 L140 216 Q200 234 260 216 L282 128 Z" fill="url(#glaze)" ' +
  'stroke="' + LINE + '" stroke-width="1.5"/>' +
  /* the reflected side: glaze is never one flat value */
  '<path d="M266 132 L250 214 Q244 218 236 219 L248 132 Z" fill="#c9d8cd" opacity=".6"/>' +
  /* specular streak on the lit side */
  '<path d="M136 134 q3 40 10 74" fill="none" stroke="#fbfefb" stroke-width="5" ' +
  'stroke-linecap="round" opacity=".85"/>' +
  /* rim: an ellipse, because you see the opening */
  '<ellipse cx="200" cy="128" rx="82" ry="17" fill="#eef4ef" stroke="' + LINE + '" stroke-width="1.5"/>' +
  '<ellipse cx="200" cy="130" rx="70" ry="11" fill="#d6e2d8" opacity=".8"/>' +
  cut(200, 182, 54, { depth: 1.2 }) +
  /* a wisp of steam, drawn thin so it does not read as a scratch */
  '<path d="M186 108 q8 -14 -2 -26 q-10 -12 0 -24" fill="none" stroke="#c3d4c8" ' +
  'stroke-width="2" stroke-linecap="round" opacity=".55"/>' +
  '<path d="M214 104 q9 -13 0 -24 q-9 -11 1 -22" fill="none" stroke="#c3d4c8" ' +
  'stroke-width="1.7" stroke-linecap="round" opacity=".4"/>',
  'A tea cup with the name on its wall'
);

/* ------------------------------------------------------------- stationery
   A hanging scroll, seen slightly from above: the top rod is an ellipse, the
   paper casts a shadow onto the wall, and the bottom rod is heavier because it
   is what holds the paper taut. The vertical column is what makes this read as
   writing rather than as decoration. */
ART.stationery = frame(
  /* shadow cast to the right, since light comes from the left */
  '<rect x="176" y="58" width="110" height="190" fill="#c6d6ca" opacity=".35" rx="3"/>' +
  /* silk mounting, wider than the paper */
  '<rect x="146" y="52" width="112" height="202" fill="#e3ece5" stroke="' + LINE + '" stroke-width="1.2"/>' +
  /* the paper itself */
  '<rect x="160" y="62" width="84" height="182" fill="url(#cloth)" stroke="#c4d3c7" stroke-width="1.1"/>' +
  /* two faint columns either side of the name, as ruled guide lines */
  '<line x1="176" y1="82" x2="176" y2="224" stroke="#cbdacf" stroke-width="1" opacity=".7"/>' +
  '<line x1="228" y1="82" x2="228" y2="224" stroke="#cbdacf" stroke-width="1" opacity=".7"/>' +
  cut(202, 152, 58, { depth: 1.1 }) +
  /* a small seal below the character, the way a scroll is actually signed */
  '<rect x="192" y="196" width="20" height="20" rx="2" fill="#a8392a" opacity=".85"/>' +
  print(202, 206, 13, '#f4fbf6') +
  /* top rod, with knobs that overhang */
  '<ellipse cx="202" cy="52" rx="62" ry="9" fill="url(#metal)" stroke="#b09a5f" stroke-width="1.2"/>' +
  '<circle cx="142" cy="52" r="5" fill="#d9c58a" stroke="#b09a5f" stroke-width="1"/>' +
  '<circle cx="262" cy="52" r="5" fill="#d9c58a" stroke="#b09a5f" stroke-width="1"/>' +
  /* bottom rod, heavier */
  '<ellipse cx="202" cy="254" rx="66" ry="10" fill="url(#metal)" stroke="#b09a5f" stroke-width="1.2"/>' +
  '<circle cx="138" cy="254" r="5.5" fill="#d9c58a" stroke="#b09a5f" stroke-width="1"/>' +
  '<circle cx="266" cy="254" r="5.5" fill="#d9c58a" stroke="#b09a5f" stroke-width="1"/>',
  'An unrolled scroll with a vertical character'
);

/* ------------------------------------------------------------------- fan
   The leaf is an annulus sector. The character sits at the mean radius, which
   is where an inscription actually sits — not at the pivot. The ribs are drawn
   under the leaf so only the outer halves show, which is how a folding fan
   actually looks when opened. */
ART.fan = frame(
  /* ribs first: they run from the pivot out to the edge */
  '<g stroke="#bcd0c4" stroke-width="2.4" stroke-linecap="round" opacity=".9">' +
  '<line x1="200" y1="266" x2="58" y2="208"/>' +
  '<line x1="200" y1="266" x2="104" y2="172"/>' +
  '<line x1="200" y1="266" x2="152" y2="140"/>' +
  '<line x1="200" y1="266" x2="200" y2="126"/>' +
  '<line x1="200" y1="266" x2="248" y2="140"/>' +
  '<line x1="200" y1="266" x2="296" y2="172"/>' +
  '<line x1="200" y1="266" x2="342" y2="208"/>' +
  '</g>' +
  /* the leaf, laid over the ribs so the ribs stop at the paper edge */
  '<path d="M151.8 248.5 L59.1 211.0 A152 152 0 0 1 340.9 211.0 L248.2 248.5 A52 52 0 0 0 151.8 248.5 Z" ' +
  'fill="url(#cloth)" stroke="' + LINE + '" stroke-width="1.4"/>' +
  /* a second, inner arc: the fold line where the leaf doubles over */
  '<path d="M156 240 A56 56 0 0 1 244 240" fill="none" stroke="#cfded4" stroke-width="1.1"/>' +
  cut(200, 176, 46, { depth: 1.1 }) +
  /* the pivot, seen from the side */
  '<circle cx="200" cy="266" r="6" fill="url(#metal)" stroke="#b09a5f" stroke-width="1"/>',
  'A folding fan with the name painted along the arc'
);

/* ----------------------------------------------------------------- daily
   Mug in profile. The handle is an open arc so the body stays the focal point,
   and the body is glazed with a highlight down the lit side. The shadow on the
   table is offset right, which is what puts the mug on a surface. */
ART.daily = frame(
  /* table shadow */
  '<ellipse cx="216" cy="244" rx="86" ry="13" fill="#93ac9e" opacity=".4"/>' +
  /* handle behind the body, so the join is hidden */
  '<path d="M250 132 q46 4 46 42 q0 38 -46 42" fill="none" stroke="#d0ded3" stroke-width="13" ' +
  'stroke-linecap="round"/>' +
  '<path d="M250 132 q46 4 46 42 q0 38 -46 42" fill="none" stroke="url(#glaze)" stroke-width="9" ' +
  'stroke-linecap="round"/>' +
  /* body */
  '<rect x="118" y="90" width="132" height="150" rx="12" fill="url(#glaze)" ' +
  'stroke="' + LINE + '" stroke-width="1.5"/>' +
  /* reflected side */
  '<path d="M238 96 l0 138 q6 -2 6 -10 l0 -118 q0 -8 -6 -10 z" fill="#c9d8cd" opacity=".55"/>' +
  /* specular streak */
  '<path d="M132 104 q6 56 8 118" fill="none" stroke="#fbfefb" stroke-width="6" ' +
  'stroke-linecap="round" opacity=".8"/>' +
  /* rim */
  '<ellipse cx="184" cy="90" rx="66" ry="13" fill="#eef4ef" stroke="' + LINE + '" stroke-width="1.5"/>' +
  '<ellipse cx="184" cy="92" rx="55" ry="8" fill="#d8e4da" opacity=".75"/>' +
  print(184, 166, 56),
  'A mug with the name printed on its side'
);

/* ------------------------------------------------------------------ wear
   Shirt drawn flat, the way a print file is laid out — which is also the way
   the name is positioned before it ever reaches the fabric. The fold down the
   middle and the shadow under the sleeves are what stop it reading as a paper
   cut-out. */
ART.wear = frame(
  /* shadow under the whole garment */
  '<path d="M156 92 L184 80 Q200 94 216 80 L244 92 L284 126 L258 154 L246 142 L246 232 ' +
  'L154 232 L154 142 L142 154 L116 126 Z" fill="#aec4b7" opacity=".35" transform="translate(6 8)"/>' +
  '<path d="M152 84 L180 70 Q200 85 220 70 L248 84 L288 120 L262 150 L250 138 L250 230 ' +
  'L150 230 L150 138 L138 150 L112 120 Z" fill="url(#cloth)" stroke="' + LINE + '" stroke-width="1.5"/>' +
  /* collar, drawn open so the neck hole reads */
  '<path d="M180 70 q20 16 40 0 q-8 20 -20 20 q-12 0 -20 -20 z" fill="#dde8df" stroke="' + LINE + '" stroke-width="1.2"/>' +
  /* sleeve seams */
  '<path d="M150 138 q10 6 12 14" fill="none" stroke="#c4d3c7" stroke-width="1.2"/>' +
  '<path d="M250 138 q-10 6 -12 14" fill="none" stroke="#c4d3c7" stroke-width="1.2"/>' +
  /* soft fold down the centre, light on one side of it */
  '<path d="M200 96 l0 130" stroke="#d2e0d6" stroke-width="1.6" opacity=".7"/>' +
  print(200, 162, 44),
  'A shirt with the name across the chest'
);

/* ----------------------------------------------------------------- plush
   Soft body, flat panel. The inner circle is the embroidered patch, so the
   character sits on the one surface that does not stretch. The body gets a
   gradient rather than a flat fill because a soft object has no hard edges. */
ART.plush = frame(
  '<defs><radialGradient id="pl" cx=".38" cy=".32" r=".78">' +
  '<stop offset="0" stop-color="#fbfffc"/><stop offset=".6" stop-color="#f8efdb"/>' +
  '<stop offset="1" stop-color="#d2e0d6"/></radialGradient></defs>' +
  /* shadow */
  '<ellipse cx="206" cy="256" rx="86" ry="14" fill="#93ac9e" opacity=".42"/>' +
  /* ears behind the head */
  '<circle cx="136" cy="96" r="29" fill="url(#pl)" stroke="' + LINE + '" stroke-width="1.4"/>' +
  '<circle cx="264" cy="96" r="29" fill="url(#pl)" stroke="' + LINE + '" stroke-width="1.4"/>' +
  '<circle cx="136" cy="96" r="16" fill="#dbe7de"/>' +
  '<circle cx="264" cy="96" r="16" fill="#dbe7de"/>' +
  /* head */
  '<circle cx="200" cy="166" r="88" fill="url(#pl)" stroke="' + LINE + '" stroke-width="1.5"/>' +
  /* the embroidered patch: a ring of stitches, shown as a dashed circle */
  '<circle cx="200" cy="170" r="56" fill="#e4eee7" stroke="#c3d3c7" stroke-width="1.2"/>' +
  '<circle cx="200" cy="170" r="56" fill="none" stroke="#a9c0b3" stroke-width="1.4" ' +
  'stroke-dasharray="3 4" opacity=".8"/>' +
  /* eyes, small and low, which is what makes a circle read as a face */
  '<circle cx="172" cy="132" r="4.4" fill="#4a4136"/>' +
  '<circle cx="228" cy="132" r="4.4" fill="#4a4136"/>' +
  '<circle cx="173.6" cy="130.4" r="1.5" fill="#fbfefb"/>' +
  '<circle cx="229.6" cy="130.4" r="1.5" fill="#fbfefb"/>' +
  cut(200, 170, 52, { depth: 1.1 }) +
  /* muzzle, below the name so it does not compete with it */
  '<ellipse cx="200" cy="212" rx="8" ry="6" fill="#b8cdc1"/>',
  'A plush toy with the name embroidered on a panel'
);

/* ---------------------------------------------------------------- figure
   Base plate in perspective with an abstract figure above it, so the drawing
   reads as "a base" without borrowing anyone's character design. The plate is
   a trapezoid because a rectangle would read as a box seen straight on, and
   the name sits on the front edge, which is the only face you can read.

   The front edge is deliberately tall. A first version gave it 10px of height,
   which forced a 22px glyph — half the size of every other card, so the name
   was unreadable at thumb size even though the drawing itself was fine. The
   edge is now 30px deep and the glyph 30px. */
ART.figure = frame(
  /* shadow cast by the figure onto the plate */
  '<ellipse cx="206" cy="216" rx="44" ry="9" fill="#8fa89b" opacity=".42"/>' +
  /* the figure: no face, no costume — a silhouette, so it stays abstract */
  '<circle cx="200" cy="106" r="31" fill="url(#stone)" stroke="#b9cec2" stroke-width="1.4"/>' +
  '<path d="M200 138 q-44 12 -44 66 l88 0 q0 -54 -44 -66 z" fill="url(#stone)" ' +
  'stroke="#b9cec2" stroke-width="1.4"/>' +
  /* plate, top face */
  '<path d="M82 206 L318 206 L292 244 L108 244 Z" fill="#eaf2ec" stroke="' + LINE + '" stroke-width="1.2"/>' +
  /* the bevel between the two faces, drawn before the front edge so the edge
     overlaps it cleanly */
  '<path d="M82 206 L318 206" stroke="' + LINE + '" stroke-width="1.4"/>' +
  /* a hint of the reflected back edge, which is what gives the plate depth */
  '<path d="M96 214 L304 214" stroke="#d4e1d7" stroke-width="1" opacity=".7"/>' +
  /* front edge, where the name goes: taller than the top face is wide, so the
     glyph gets the same optical size as the other nine cards */
  '<path d="M108 244 L292 244 L284 276 L116 276 Z" fill="#dae5dc" stroke="' + LINE + '" stroke-width="1.2"/>' +
  /* a soft darkening at the bottom of the edge, so it meets the paper */
  '<path d="M116 276 L284 276 L283 280 L117 280 Z" fill="#c6d6ca" opacity=".7"/>' +
  cut(200, 260, 30, { depth: .9 }),
  'A display base with the name engraved on its front edge'
);

/* ----------------------------------------------------------------- blade
   Long and narrow, rotated so the vertical column is visibly the only
   orientation that fits. Nothing points, nothing tapers — it reads as a
   display piece, which is what it is. The scabbard has a lacquered sheen and
   the fittings are metal, so the eye can tell the two materials apart. */
ART.blade = frame(
  '<g transform="rotate(-13 200 152)">' +
    /* shadow along the lower edge */
    '<rect x="46" y="140" width="308" height="48" rx="24" fill="#b3c9bd" opacity=".33"/>' +
    /* scabbard body */
    '<rect x="46" y="126" width="308" height="48" rx="24" fill="url(#cloth)" ' +
    'stroke="' + LINE + '" stroke-width="1.4"/>' +
    /* lacquer sheen: a long highlight down the upper third */
    '<path d="M70 136 l260 0" stroke="#fbfefb" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
    /* the two metal bands */
    '<rect x="96" y="124" width="13" height="52" rx="5" fill="url(#metal)" stroke="#b09a5f" stroke-width="1"/>' +
    '<rect x="286" y="124" width="13" height="52" rx="5" fill="url(#metal)" stroke="#b09a5f" stroke-width="1"/>' +
    /* the chape at the far end */
    '<path d="M340 126 q14 24 0 48 q-10 0 -10 -24 q0 -24 10 -24 z" fill="url(#metal)" stroke="#b09a5f" stroke-width="1"/>' +
    cut(200, 150, 30, { depth: .9 }) +
  '</g>',
  'A long display piece with the name along its length'
);

module.exports = { ART, SAMPLE };

/* Where the visitor's content lands, per carrier. These are not guesses — each
   pair is lifted from the cut()/print() call that draws the sample, so the
   preview is guaranteed to sit in the same recess. Coordinates are in the
   SVG's 400x300 viewBox. light:true inverts the ink on a dark ground (the
   seal's red impression).

   `arc` is the fan's own geometry, not a bend factor: the pivot the ribs meet
   at, and the radius the inscription sits on. A name on a fan follows the
   leaf, so each glyph has to be turned to face the pivot — a straight column
   on a sector reads as a stamp pasted on. The radius is derived from the
   drawing: the pivot is (200,266) and the sample sits at y=176. */
const ANCHORS = {
  seal: [
    { x: 127, y: 186, size: 76, mark: 'cut', rot: -4, ink: 'ink' },
    { x: 302, y: 172, size: 66, mark: 'cut', rot: 2, ink: 'paper', light: true }
  ],
  jewelry: [{ x: 200, y: 186, size: 62, mark: 'cut', ink: 'ink' }],
  tea: [{ x: 200, y: 182, size: 54, mark: 'cut', ink: 'ink' }],
  stationery: [
    { x: 202, y: 152, size: 58, mark: 'cut', ink: 'ink' },
    { x: 202, y: 206, size: 13, mark: 'print', ink: 'cinnabar', role: 'signature' }
  ],
  fan: [{ x: 200, y: 176, size: 46, mark: 'cut', ink: 'ink',
          arc: { cx: 200, cy: 266, r: 90 } }],
  daily: [{ x: 184, y: 166, size: 56, mark: 'print', ink: 'ink' }],
  wear: [{ x: 200, y: 162, size: 44, mark: 'print', ink: 'ink' }],
  plush: [{ x: 200, y: 170, size: 52, mark: 'cut', ink: 'ink' }],
  figure: [{ x: 200, y: 260, size: 30, mark: 'cut', ink: 'ink' }],
  blade: [{ x: 200, y: 150, size: 30, mark: 'cut', ink: 'ink' }]
};

/* Each coordinate above is copied from the cut()/print() call that draws the
   sample, in this order of appearance in the file:
     seal        132 cut(127,186,76) / 142 cut(302,172,66)
     jewelry     166 cut(200,186,62)
     tea         191 cut(200,182,54)
     stationery  215 cut(202,152,58) + 218 print(202,206,13)
     fan         251 cut(200,176,46)
     daily       280 print(184,166,56)
     wear        302 print(200,162,44)
     plush       332 cut(200,170,52)
     figure      367 cut(200,260,30)
     blade       390 cut(200,150,30) */
module.exports.ANCHORS = ANCHORS;
module.exports.setBlank = setBlank;
