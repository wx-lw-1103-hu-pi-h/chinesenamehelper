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

module.exports = { u, hashOf };
