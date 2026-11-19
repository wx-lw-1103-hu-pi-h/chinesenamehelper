/* Content-hashed asset URLs.

   The generators used to emit /assets/css/main.css and /assets/js/app.js with no
   version at all. Every edit to a stylesheet or script therefore depended on the
   browser deciding to revalidate, and a visitor (or the author, mid-review) could
   keep seeing the previous build for an arbitrarily long time. A stylesheet that
   is one build behind looks like "the change did nothing" or, worse, like a
   half-applied design.

   The hash is derived from the file bytes, so it changes exactly when the file
   changes and never needs to be bumped by hand. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, 'site');
const cache = new Map();

function hashOf(urlPath) {
  if (cache.has(urlPath)) return cache.get(urlPath);
  const abs = path.join(ROOT, urlPath.replace(/^\//, ''));
  const h = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 8);
  cache.set(urlPath, h);
  return h;
}

/* /assets/css/main.css -> /assets/css/main.css?v=1a2b3c4d */
function u(urlPath) {
  return urlPath + '?v=' + hashOf(urlPath);
}

/* Same as u(), for a path that contains non-ASCII segments.

   The stroke data sits at /assets/hanzi-data/中.json on disk, but the URL a
   browser asks for is percent-encoded. Hashing needs the on-disk name; the
   output needs the encoded one. Passing either form to u() would be wrong in
   one direction — encoded hashes a file that does not exist, raw emits a URL
   that does not match the canonical form the rest of the site uses — so both
   are derived from the raw path here. */
function uEncoded(rawPath) {
  const encoded = rawPath.split('/').map(function (seg) {
    return seg ? encodeURIComponent(seg) : seg;
  }).join('/');
  return encoded + '?v=' + hashOf(rawPath);
}

module.exports = { u, uEncoded, hashOf };
