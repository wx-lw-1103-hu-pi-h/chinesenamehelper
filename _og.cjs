/* One place that knows the og:image path for each kind of page, so the four
   generators cannot drift apart on the naming scheme.
 
   The cards themselves are built by _gen_og.cjs; this module only resolves the
   URL and, importantly, refuses to emit one that was never generated. A
   meta tag pointing at a 404 is worse than no tag at all: the crawler treats
   the link as having no preview image and some scrapers cache the failure. */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const OG_DIR = path.join(SITE, 'assets', 'og');

function file(name) {
  return path.join(OG_DIR, name + '.png');
}

/* Absolute URL: og:image must be absolute for most scrapers, and a relative
   path is silently ignored by several of them. */
function url(name, origin) {
  if (!fs.existsSync(file(name))) return '';
  return origin + '/assets/og/' + name + '.png';
}

/* Character cards are named by code point, not by the glyph: a URL with a
   raw CJK character in it is legal but gets percent-encoded into something
   unreadable, and some CDNs normalise it inconsistently. */
function charName(ch) {
  return 'char-' + ch.codePointAt(0).toString(16);
}

function giftName(slug, code) {
  return 'gift-' + slug + '-' + code;
}

/* The tags, or an empty string when the card is missing. Callers interpolate
   the result directly, so a missing card degrades to "no tag" rather than a
   broken link. */
function tags(name, origin, alt) {
  const u = url(name, origin);
  if (!u) return '';
  const esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  return '<meta property="og:image" content="' + u + '">\n' +
    '<meta property="og:image:width" content="1200">\n' +
    '<meta property="og:image:height" content="630">\n' +
    '<meta property="og:image:alt" content="' + esc(alt) + '">\n' +
    '<meta name="twitter:image" content="' + u + '">';
}

module.exports = { tags: tags, url: url, charName: charName, giftName: giftName, OG_DIR: OG_DIR };
