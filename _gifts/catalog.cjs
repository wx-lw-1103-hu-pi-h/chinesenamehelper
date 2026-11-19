/**
 * The gift catalogue: carriers that can hold a Chinese name.
 *
 * This is the only place a carrier is described. The page generator reads it,
 * the sitemap reads it, and the navigation reads it — so adding a carrier is
 * one entry here plus its strings, not an edit in four files that drift apart.
 *
 * Two rules decided what is in this list:
 *
 *   1. A carrier has to be something a Chinese name is actually written on.
 *      Notebooks, mugs and phone cases qualify because the name is engraved or
 *      printed on them; a gift card does not, because there is nothing to
 *      write on. That is the line between this site's subject and a generic
 *      affiliate catalogue.
 *
 *   2. Nothing here is a weapon. This used to carry a `blade` entry — display
 *      katana and shinai pieces, unsharpened, clearly marked decorative — on the
 *      argument that it is sold and searched as a display object rather than an
 *      edged tool. It has been removed. Stripe's prohibited list names only
 *      "illegal weapons and accessories" and improperly marked firearm
 *      replicas, so an unsharpened display sword is not prohibited today; but
 *      its published guidance also puts weapons-related businesses under review,
 *      and payment acceptance is judged on the business as a whole. Carrying ten
 *      searches a month is not worth putting a weapons label on a site whose
 *      subject is names, especially once payments are switched on. Should the
 *      category ever come back, it comes back after the account is approved and
 *      with an explicit answer from the processor, not before.
 *
 * `fit` is the interesting part. A character that reads clearly when engraved
 * on a 12 mm seal is not the same character that works on a hanging scroll —
 * 明 at 8 strokes is fine at stamp size, 曦 at 20 strokes becomes a smudge. The
 * generator turns `fit` into a real list drawn from the character library, so
 * each page answers "which name should I put on this" instead of just showing
 * a picture.
 */

/* Owner address for the enquiry form. Every carrier page builds its mailto:
   from this, so changing it here is the whole change. */
const CONTACT = 'w5056499@gmail.com';

/* Flexbox/grid order on the hub, chosen so the page opens with the two
   carriers that best match what people already search for.

   `image` is the key of the drawn illustration, which is also the plate the
   configurator stamps onto. `photo`, where present, is a real product photograph
   used in the hub card and at the top of the carrier page; the drawing stays the
   fallback so a carrier without a photograph still has artwork. */
module.exports = [
  {
    slug: 'seal',
    icon: '印',
    image: 'seal',
    photo: 'seal.jpg',
    /* A seal is carved in relief or intaglio, so strokes merge as they get
       denser. Two characters at 10 strokes or under stay legible at 15 mm. */
    fit: { chars: 2, maxStrokes: 10, layout: 'vertical', stones: ['石', '木', '玉'] },
    featured: true
  },
  {
    slug: 'jewelry',
    icon: '环',
    image: 'jewelry',
    photo: 'jewelry.jpg',
    /* A pendant is worn against the skin and read at arm's length, so one or
       two characters and plenty of空白. This is the narrowest carrier. */
    fit: { chars: 1, maxStrokes: 12, layout: 'single', stones: ['金', '玉'] },
    featured: true
  },
  {
    slug: 'tea',
    icon: '茶',
    image: 'tea',
    /* Teaware is held in the hand, which buys room: a cup wall or a tea scoop
       takes more strokes than a ring. */
    fit: { chars: 2, maxStrokes: 16, layout: 'horizontal', stones: ['土', '木'] },
    featured: true
  },
  {
    slug: 'stationery',
    icon: '文',
    image: 'stationery',
    /* Paper and scrolls have no size limit, so this is where the dense
       characters belong. */
    fit: { chars: 3, maxStrokes: 20, layout: 'vertical', stones: ['纸', '木'] },
    featured: true
  },
  {
    slug: 'fan',
    icon: '扇',
    image: 'fan',
    photo: 'fan.jpg',
    /* The Chinese answer to "long, vertical, ceremonial". A fan leaf takes a
       column of characters laid along an arc, so it holds more than a seal but
       needs the layout done on the mounted fan rather than flat. */
    fit: { chars: 4, maxStrokes: 18, layout: 'vertical', stones: ['纸', '竹'] },
    featured: true
  },
  {
    slug: 'daily',
    icon: '用',
    image: 'daily',
    /* Printed or engraved on a flat product surface: a middle band. */
    fit: { chars: 2, maxStrokes: 14, layout: 'horizontal', stones: [] },
    featured: true
  },
  {
    slug: 'wear',
    icon: '衣',
    image: 'wear',
    /* Fabric at garment scale carries three characters comfortably. */
    fit: { chars: 3, maxStrokes: 18, layout: 'horizontal', stones: [] },
    featured: true
  },
  {
    slug: 'plush',
    icon: '绒',
    image: 'plush',
    photo: 'plush.jpg',
    /* Embroidered on a soft body: the stitch direction distorts diagonals, so
       squarer characters survive better than sprawling ones. */
    fit: { chars: 1, maxStrokes: 14, layout: 'single', stones: [] },
    featured: true
  },
  {
    slug: 'figure',
    icon: '座',
    image: 'figure',
    /* Engraved on a base plate and read from above, often at a glance. */
    fit: { chars: 2, maxStrokes: 12, layout: 'horizontal', stones: [] },
    featured: true
  }
];

module.exports.CONTACT = CONTACT;
