/**
 * Write the blank carrier plates used by the customiser.
 *
 * Run with BLANK=1 so art.cjs builds ART with every engraved glyph removed.
 * _gen_gifts.cjs calls this as a child process: ART is evaluated once at
 * require time, so switching the flag in the parent would have no effect.
 *
 * The output is byte-identical to the normal illustration except for the
 * empty <text> elements. That is the whole trick — the browser draws this
 * plate as an image and then stamps the visitor's own content at the anchor
 * coordinates, which the parent writes to gift-anchors.js from the same
 * source of truth.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const OUT = path.join(ROOT, 'assets', 'img', 'gifts');
const { ART } = require('./_gifts/art.cjs');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let n = 0;
Object.keys(ART).forEach(function (slug) {
  fs.writeFileSync(path.join(OUT, slug + '-blank.svg'), ART[slug], 'utf8');
  n++;
});
console.log('wrote ' + n + ' blank carrier plates');
