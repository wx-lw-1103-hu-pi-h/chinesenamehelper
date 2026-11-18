/**
 * Build the brand mark from the character's own outlines.
 *
 * The mark used to be the text "名" centred in a 34px box. Text centring is
 * based on the line box the font reports, not on the ink the eye sees: with
 * line-height:1 (25px) against a Noto ascent+descent block of 36px, plus a
 * glyph that sits low in its em square, the mark measured 0.5px left and 1px
 * low. Worse, the offset changes with whichever serif the system falls back to,
 * so a CSS nudge tuned on Windows is wrong on macOS.
 *
 * Drawing the actual outlines removes the variable entirely: the viewBox is
 * derived from the measured ink box, so the glyph is centred by construction on
 * every platform, and nothing depends on a font being installed.
 *
 * The figure is a 朱文印 — a relief seal, where the impression is the ink and
 * the field stays paper. It replaced a solid cinnabar tile with a knocked-out
 * white 名, which is the same construction, the same glyph and the same colour
 * relationship as the competing site's icon. Three of three matching is not a
 * coincidence the eye forgives; it just reads as a copy. Changing only the
 * glyph would have left the tile, and changing only the tile would have left
 * the glyph, so this changes the character (名 -> 字), the field (filled -> bare)
 * and the ink (white -> cinnabar) together.
 *
 * A frame, rather than a filled plate, is also the quieter of the two against a
 * paper header — the header had been carrying the loudest block on the page.
 *
 *   node _gen_logo.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const SRC = path.join(ROOT, 'assets/hanzi-data/字.json');
const OUT = path.join(ROOT, 'assets/img');

const CHAR = '字';
const PAPER = '#fbf9f4';
const CINNABAR = '#b23a2a';
const INK = '#17241f';

/* ---------------- path parsing ---------------- */

/* The dataset only uses absolute M/L/Q/C/Z, but parse loosely so a future
   character that ships relative commands does not break silently. */
function tokens(d) {
  return d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
}

function bezierPoint(p0, ctrl, t) {
  const mt = 1 - t;
  let x = 0, y = 0;
  if (ctrl.length === 2) {
    x = mt * mt * p0[0] + 2 * mt * t * ctrl[0][0] + t * t * ctrl[1][0];
    y = mt * mt * p0[1] + 2 * mt * t * ctrl[0][1] + t * t * ctrl[1][1];
  } else {
    x = mt * mt * mt * p0[0] + 3 * mt * mt * t * ctrl[0][0] + 3 * mt * t * t * ctrl[1][0] + t * t * t * ctrl[2][0];
    y = mt * mt * mt * p0[1] + 3 * mt * mt * t * ctrl[0][1] + 3 * mt * t * t * ctrl[1][1] + t * t * t * ctrl[2][1];
  }
  return [x, y];
}

/* Sample every curve instead of solving for extrema — 32 steps per segment is
   far below a device pixel at any size this mark is drawn. */
function pathPoints(d) {
  const tk = tokens(d);
  const pts = [];
  let i = 0;
  let cur = [0, 0];
  let start = [0, 0];
  let cmd = null;

  const num = () => parseFloat(tk[i++]);

  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++];
    if (cmd === 'Z' || cmd === 'z') { cur = start; cmd = null; continue; }
    if (!cmd) break;

    const abs = cmd === cmd.toUpperCase();
    const c = cmd.toUpperCase();

    if (c === 'M') {
      const x = num(), y = num();
      cur = abs ? [x, y] : [cur[0] + x, cur[1] + y];
      start = cur; pts.push(cur);
      cmd = abs ? 'L' : 'l';
    } else if (c === 'L') {
      const x = num(), y = num();
      cur = abs ? [x, y] : [cur[0] + x, cur[1] + y];
      pts.push(cur);
    } else if (c === 'Q') {
      const cx = num(), cy = num(), x = num(), y = num();
      const ctrl = abs ? [[cx, cy]] : [[cur[0] + cx, cur[1] + cy]];
      const end = abs ? [x, y] : [cur[0] + x, cur[1] + y];
      for (let s = 1; s <= 32; s++) pts.push(bezierPoint(cur, [ctrl[0], end], s / 32));
      cur = end;
    } else if (c === 'C') {
      const c1x = num(), c1y = num(), c2x = num(), c2y = num(), x = num(), y = num();
      const ctrl = abs
        ? [[c1x, c1y], [c2x, c2y]]
        : [[cur[0] + c1x, cur[1] + c1y], [cur[0] + c2x, cur[1] + c2y]];
      const end = abs ? [x, y] : [cur[0] + x, cur[1] + y];
      for (let s = 1; s <= 32; s++) pts.push(bezierPoint(cur, [ctrl[0], ctrl[1], end], s / 32));
      cur = end;
    } else {
      /* Unsupported command: stop rather than guess. */
      break;
    }
  }
  return pts;
}

/* ---------------- measurement ---------------- */

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const strokes = data.strokes;

const all = [];
strokes.forEach((d) => pathPoints(d).forEach((p) => all.push(p)));

const minX = Math.min(...all.map((p) => p[0]));
const maxX = Math.max(...all.map((p) => p[0]));
/* The dataset is y-up. Flip it once here so the numbers below read like the
   SVG coordinate space the mark is actually drawn in. */
const minY = Math.min(...all.map((p) => p[1]));
const maxY = Math.max(...all.map((p) => p[1]));

const inkW = maxX - minX;
const inkH = maxY - minY;
const inkCx = (minX + maxX) / 2;
/* After translate(0,900) scale(1,-1) a data y becomes 900-y. */
const FLIP = 900;
const inkCy = FLIP - (minY + maxY) / 2;

console.log('ink box (data, y-up): x %s..%s  y %s..%s', minX.toFixed(3), maxX.toFixed(3), minY.toFixed(3), maxY.toFixed(3));
console.log('ink size: %s x %s   centre in flipped space: (%s, %s)',
  inkW.toFixed(3), inkH.toFixed(3), inkCx.toFixed(3), inkCy.toFixed(3));

/* ---------------- emit ---------------- */

/* Ink fills INK_FILL of the square, leaving an even optical margin. The taller
   axis sets the scale so the glyph never touches the edge.

   Inside a frame the glyph has to clear the rule as well as the border, so the
   fill drops from the 0.72 a bare plate allowed to 0.62. At 30px in the header
   that is still 18px of ink — comfortably above the point where a 6-stroke
   character starts to smear. */
const INK_FILL = 0.62;
const ICON = 64;

/* The frame is inset and hairline-thin so it reads as a seal rule rather than
   as a button: a 2.6 stroke on a 64 grid is about 1.2px at header size, which
   survives down to the 16px favicon without filling in. */
const RULE_INSET = 3;
const RULE_WIDTH = 2.6;

function markSVG(opts) {
  const { size, fill, shape, compact } = opts;
  const k = (size * INK_FILL) / Math.max(inkW, inkH);
  /* Put the ink centre of the square exactly at the centre of the icon. */
  const tx = size / 2 - inkCx * k;
  const ty = size / 2 - inkCy * k;

  let plate = '';
  if (shape === 'seal') {
    /* 朱文印: the field stays paper, the rule and the character carry the
       colour. Nothing is knocked out, so there is no solid block on the page
       and no silhouette to mistake for the competitor's tile. */
    /* A 2.6 stroke on a 64 grid is 0.65px at a 16px favicon — below one device
       pixel, so the rule antialiases into a grey smear. The compact variant
       thickens the rule and inset to the equivalent of 3px at 16px. The glyph
       stays the same: a 6-stroke character does not need help, only the frame
       does. */
    const r = compact ? 5 : RULE_INSET;
    const sw = compact ? RULE_WIDTH * 2 : RULE_WIDTH;
    plate = `<rect x="${r}" y="${r}" width="${size - r * 2}" height="${size - r * 2}" ` +
      `rx="${Math.round(size * 0.14)}" fill="none" stroke="${fill}" stroke-width="${(sw * size) / ICON}"/>`;
  } else if (shape === 'circle') {
    plate = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${fill}"/>`;
  }

  const body = strokes
    .map((d) => `    <path d="${d}"/>`)
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${CHAR}">
  ${plate}
  <g transform="translate(${tx.toFixed(4)} ${ty.toFixed(4)}) scale(${k.toFixed(6)}) translate(0 ${FLIP}) scale(1 -1)" fill="${fill}">
${body}
  </g>
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });

/* The mark used in the header, footer and as the favicon. */
fs.writeFileSync(path.join(OUT, 'mark.svg'), markSVG({ size: ICON, fill: CINNABAR, shape: 'seal' }));

/* Same figure in ink, for anything that needs a monochrome version. */
fs.writeFileSync(path.join(OUT, 'mark-ink.svg'), markSVG({ size: ICON, fill: INK, shape: 'seal' }));

/* Glyph only, no plate: available for masking and for print. */
const glyphOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON} ${ICON}">
  <g transform="translate(${((ICON / 2) - inkCx * ((ICON * INK_FILL) / Math.max(inkW, inkH))).toFixed(4)} ${((ICON / 2) - inkCy * ((ICON * INK_FILL) / Math.max(inkW, inkH))).toFixed(4)}) scale(${((ICON * INK_FILL) / Math.max(inkW, inkH)).toFixed(6)}) translate(0 ${FLIP}) scale(1 -1)" fill="currentColor">
${strokes.map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
</svg>
`;
fs.writeFileSync(path.join(OUT, 'glyph.svg'), glyphOnly);

/* Favicon: the same mark, written to the site root so /favicon.ico-style
   requests and the <link rel=icon> both resolve. Browsers paint this at 16px
   in a tab, where the header's hairline rule would disappear. */
fs.writeFileSync(path.join(ROOT, 'favicon.svg'),
  markSVG({ size: ICON, fill: CINNABAR, shape: 'seal', compact: true }));

[['mark.svg', 'mark.svg'], ['mark-ink.svg', 'mark-ink.svg'], ['glyph.svg', 'glyph.svg']].forEach(([a, b]) => {
  const p = path.join(OUT, b);
  console.log('wrote %s  (%d bytes)', path.relative(__dirname, p), fs.statSync(p).size);
});
console.log('wrote %s', path.relative(__dirname, path.join(ROOT, 'favicon.svg')));
