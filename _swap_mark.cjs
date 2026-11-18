/**
 * Swap the text brand mark for the outline SVG across every page.
 *
 * <span class="brand-mark">名</span>  ->  <img class="brand-mark" ...>
 *
 * The text glyph was drawn by whatever serif the OS had, so its ink box sat
 * a pixel or two off centre and the weight changed per platform. The outline
 * file is the character's own paths, so it is identical everywhere.
 *
 * Idempotent: a second run changes nothing.
 *
 *   node _swap_mark.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');

const MARK =
  '<img class="brand-mark" src="/assets/img/mark.svg" width="34" height="34" alt="" aria-hidden="true">';

const OLD = '<span class="brand-mark">名</span>';

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  });
}

const files = [];
walk(ROOT, files);

let hits = 0;
let touched = 0;

files.forEach((f) => {
  const before = fs.readFileSync(f, 'utf8');
  const n = before.split(OLD).length - 1;
  if (!n) return;
  fs.writeFileSync(f, before.split(OLD).join(MARK), 'utf8');
  hits += n;
  touched++;
});

console.log('pages scanned: %d', files.length);
console.log('marks replaced: %d in %d files', hits, touched);
console.log('leftovers: %d', files.filter((f) => fs.readFileSync(f, 'utf8').includes(OLD)).length);
