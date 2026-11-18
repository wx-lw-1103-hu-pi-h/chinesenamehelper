/**
 * The customiser: let a visitor put *their own* content on a carrier.
 *
 * Three modes, and the third one is the reason this file exists:
 *
 *   name    — take the Chinese name the generator produced (or one the visitor
 *             types) and engrave it.
 *   none    — leave the face bare. A seal with no name is a real order: buyer
 *             wants the stone, or wants it cut later.
 *   motif   — the visitor uploads a picture and we press it into the object.
 *
 * Everything renders onto a <canvas> rather than by mutating the SVG, because
 * the same canvas is what gets exported as the confirmation image and what the
 * visitor approves before asking for a price. One render path, one artefact.
 *
 * ## Why canvas and not SVG text
 *
 * The plate is drawn from <slug>-blank.svg, which is the illustration with its
 * engraved glyphs removed. We draw that image, then set type at the anchor
 * coordinates the drawing itself uses. That is the difference between a preview
 * and a sticker: the character lands in the recess that already has a shadow
 * cut for it, at the size the recess was cut for.
 *
 * ## The uploaded motif
 *
 * A photograph pressed onto celadon jewellery looks like a decal, and decals are
 * the single fastest way to make a page look like a dropship store. So an
 * upload is converted before it is ever drawn:
 *
 *   1. flatten to luminance,
 *   2. threshold at the midpoint of its own histogram (a fixed threshold
 *      destroys a high-key line drawing and a dark photo alike),
 *   3. render the surviving solid in cinnabar, with a one-pixel lighter edge
 *      so it keeps the slight relief a real impression has.
 *
 * The result is a seal-like monochrome mark that belongs on every carrier,
 * whatever the source image looked like. That is a deliberate trade: detail is
 * lost, coherence is bought, and the visitor sees exactly what will be cut.
 */
(function () {
  'use strict';

  var ANCHORS = window.GIFT_ANCHORS || {};
  var INK = '#17241f';
  var PAPER = '#fbfefb';
  var CINNABAR = '#b23a2a';
  var CINNABAR_D = '#8d2e21';

  /* The illustration's own viewBox. Every anchor is expressed in these units. */
  var VB_W = 400;
  var VB_H = 300;

  var FONT = '"Noto Serif SC", "Songti SC", "Source Han Serif SC", Georgia, serif';

  /* ---------- type helpers ---------- */

  /**
   * Break the visitor's text into glyphs, respecting what a carrier can hold.
   *
   * `layout` comes from the catalogue: 'vertical' stacks characters down the
   * face as a seal is cut, 'horizontal' sets them in a row as a cup is
   * decorated, 'single' clamps to one character. The cap comes from `fit.chars`,
   * so a name too long for a pendant is truncated here rather than overrunning
   * the metal at draw time.
   */
  function glyphs(text, layout, maxChars) {
    var chars = Array.from(String(text || '').replace(/\s+/g, ''));
    if (layout === 'single') return chars.slice(0, 1);
    if (maxChars && chars.length > maxChars) chars = chars.slice(0, maxChars);
    return chars;
  }

  /**
   * Draw one glyph as an engraving.
   *
   * Two passes, exactly as art.cjs does it: a shadow copy offset down-right for
   * the recess, then the lit face. `light` inverts it for dark grounds (the
   * seal's red impression is a light glyph in red ink). `flat` skips the recess
   * altogether, for the anchors whose sample is printed on the surface rather
   * than cut into it — a shadow there would claim a depth the object has not
   * got.
   */
  function engrave(ctx, ch, x, y, size, opt) {
    var o = opt || {};
    var depth = o.depth == null ? Math.max(0.8, size * 0.022) : o.depth;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = (o.weight || 500) + ' ' + size + 'px ' + FONT;

    if (!o.flat) {
      if (o.light) {
        ctx.fillStyle = 'rgba(255,255,255,.32)';
        ctx.fillText(ch, x - depth, y - depth);
      } else {
        ctx.fillStyle = o.shadow || 'rgba(143,168,155,.85)';
        ctx.fillText(ch, x + depth, y + depth);
      }
    }
    ctx.fillStyle = o.fill || INK;
    ctx.fillText(ch, x, y);
  }

  /**
   * A column of glyphs, centred on the anchor.
   *
   * Seals are cut top-to-bottom in one column, so the stack is centred
   * vertically on the anchor rather than starting at it — otherwise a two-glyph
   * name sits high and a four-glyph name runs off the bottom.
   */
  function engraveColumn(ctx, list, a, opt) {
    var n = list.length;
    if (!n) return;
    var gap = a.size * 0.16;
    var step = a.size + gap;
    var total = n * a.size + (n - 1) * gap;
    var top = a.y - total / 2 + a.size / 2;

    list.forEach(function (ch, i) {
      engrave(ctx, ch, a.x, top + i * step, a.size, opt);
    });
  }

  /** A row of glyphs, centred on the anchor. Teaware and cloth take this. */
  function engraveRow(ctx, list, a, opt) {
    var n = list.length;
    if (!n) return;
    var gap = a.size * 0.12;
    var step = a.size + gap;
    var total = n * a.size + (n - 1) * gap;
    var left = a.x - total / 2 + a.size / 2;

    list.forEach(function (ch, i) {
      engrave(ctx, ch, left + i * step, a.y, a.size, opt);
    });
  }

  /**
   * The largest type size at which `list` still fits the space an anchor gives.
   *
   * The drawing cuts one sample glyph at `a.size` with a margin around it, so a
   * one-glyph name needs no adjustment and `cap` keeps it exactly as drawn.
   * Two glyphs do not fit in that same box: they have to shrink or run off the
   * stone. `budget` is how much room there actually is — measured from the same
   * drawing (`1.9 x size` across the recess a cut glyph sits in, `1.5 x size`
   * for the smaller secondary slot) or, on the fan, along the leaf's arc.
   */
  function fitSize(list, layout, budget, cap) {
    var n = list.length;
    if (!n || layout === 'single' || !budget) return cap;
    var gap = layout === 'horizontal' ? 0.12 : 0.16;
    var unit = n + (n - 1) * gap;
    return Math.min(cap, budget / unit);
  }

  /** How much room an anchor has for a stack of glyphs, in viewBox units. */
  function budgetFor(a, layout, primary) {
    if (layout === 'single') return 0;
    /* A fan's inscription is bounded by the arc it sits on, not by a box. */
    if (a.arc && a.arc.r) return a.arc.r * 1.8;
    return a.size * (primary ? 1.9 : 1.5);
  }

  /**
   * Glyphs on a fan leaf.
   *
   * A fan leaf is an annulus sector, and an inscription on one runs along the
   * arc at a fixed radius — each character turned so its own vertical axis
   * points at the pivot. Stacking them in a straight column instead is the one
   * thing that makes a fan look like a print-out glued to a fan.
   *
   * `a.arc` carries the geometry from art.cjs: the pivot the ribs meet at and
   * the radius the sample inscription was cut on. Both are the drawing's own
   * numbers, so the visitor's name lands on the same arc as the sample.
   *
   * The step is measured along the arc, not in a straight line, so a four-glyph
   * name spreads evenly instead of crowding the ends where the chord and the
   * arc diverge.
   */
  function engraveArc(ctx, list, a, opt) {
    var n = list.length;
    if (!n) return;
    var g = a.arc;
    if (!g || !g.r) { engraveColumn(ctx, list, a, opt); return; }

    /* Degrees per glyph: the glyph box plus a gap, converted through the
       radius. Fitted sizes keep a normal name well inside the leaf; the clamp
       only stops a pathological one from wrapping past the edge and starting
       to read backwards. */
    var step = a.size * 1.16;
    var per = step / g.r;                       /* radians between glyphs */
    var start = (n - 1) / 2;                    /* index of the middle glyph */
    var max = Math.PI * 0.5;                    /* never past +-45deg */
    if ((n - 1) / 2 * per > max) per = max / Math.max(1, (n - 1) / 2);

    list.forEach(function (ch, i) {
      var ang = (i - start) * per;
      /* Position on the arc, measured from straight up from the pivot. */
      var x = g.cx + g.r * Math.sin(ang);
      var y = g.cy - g.r * Math.cos(ang);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      engrave(ctx, ch, 0, 0, a.size, opt);
      ctx.restore();
    });
  }

  /* ---------- the uploaded motif ---------- */

  /**
   * Turn an arbitrary picture into a cinnabar impression.
   *
   * A fixed threshold is wrong for both ends of the range: it wipes out a pale
   * pencil sketch and floods a night photo. The threshold is therefore taken
   * from the image's own mean luminance, pulled slightly toward the dark end so
   * that a line drawing keeps its lines instead of filling in.
   *
   * Returns a canvas the size of the source, containing only cinnabar where the
   * picture was dark. Everything else is transparent, so it can be composited
   * onto any plate without a white box around it.
   */
  function impression(img) {
    var c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    var cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);

    var frame;
    try {
      frame = cx.getImageData(0, 0, c.width, c.height);
    } catch (e) {
      /* A cross-origin image taints the canvas. Local uploads never do, but a
         pasted URL would, and a silent failure is worse than a plain one. */
      return null;
    }

    var d = frame.data;
    var sum = 0, count = 0;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 24) continue;              /* skip transparent margin */
      sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      count++;
    }
    var mean = count ? sum / count : 128;
    var cut = mean * 0.94;

    var cr = 0xb2, cg = 0x3a, cb = 0x2a;
    for (var j = 0; j < d.length; j += 4) {
      if (d[j + 3] < 24) { d[j + 3] = 0; continue; }
      var lum = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
      if (lum < cut) {
        /* Keep a trace of the source's own contrast so the mark is not a flat
           silhouette: darker pixels stay fully opaque, edge pixels thin out. */
        var k = 1 - lum / Math.max(1, cut);
        d[j] = cr; d[j + 1] = cg; d[j + 2] = cb;
        d[j + 3] = Math.round(90 + 165 * Math.min(1, k));
      } else {
        d[j + 3] = 0;
      }
    }
    cx.putImageData(frame, 0, 0);
    return c;
  }

  /* The plate is drawn from each carrier's own <slug>-blank.svg, which is the
     illustration with its sample glyph removed. */
  var PLATE = {};
  function plate(slug, cb) {
    if (PLATE[slug]) {
      if (PLATE[slug].ok) cb(PLATE[slug].img);
      else PLATE[slug].wait.push(cb);
      return;
    }
    var rec = { ok: false, img: new Image(), wait: [cb] };
    PLATE[slug] = rec;
    rec.img.onload = function () {
      rec.ok = true;
      var q = rec.wait; rec.wait = [];
      q.forEach(function (f) { f(rec.img); });
    };
    rec.img.onerror = function () {
      /* A missing plate is not worth an empty canvas: every queued caller gets
         null and the plate is dropped from the cache so a retry can reload. */
      delete PLATE[slug];
      var q = rec.wait; rec.wait = [];
      q.forEach(function (f) { f(null); });
    };
    /* Blank plates sit inside the site's absolute paths, so the page's own
       origin resolves them wherever the locale prefix is. */
    rec.img.src = '/assets/img/gifts/' + slug + '-blank.svg';
  }

  /* ---------- the plate ---------- */

  /**
   * Draw a carrier with the visitor's content on it.
   *
   * Returns a canvas sized to `pxW` wide. Every coordinate is converted from
   * the 400x300 viewBox so the caller never has to think about scale.
   */
  function paint(opts) {
    var slug = opts.slug;
    var plate = opts.plate;                    /* HTMLImageElement, loaded */
    var pxW = opts.width || 800;
    var pxH = Math.round(pxW * VB_H / VB_W);

    var canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    var ctx = canvas.getContext('2d');

    var k = pxW / VB_W;                        /* viewBox unit -> pixel */

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, pxW, pxH);
    if (plate) ctx.drawImage(plate, 0, 0, pxW, pxH);

    var list = ANCHORS[slug] || [];
    var mode = opts.mode || 'name';
    var text = String(opts.text || '');

    if (mode === 'none' || !list.length) return canvas;

    if (mode === 'motif' && opts.motif) {
      /* The mark goes on every anchor, because a seal's impression is pressed
         from the same stone as its face — one design, two places. On the stone
         itself the mark is cut and reads dark; on the red impression it has to
         be knocked out to paper, since cinnabar on cinnabar is invisible. */
      var mut = opts.motif;
      var aspect = mut.height / mut.width;
      list.forEach(function (a) {
        /* A mark is a composition, not a glyph: it gets a wider box than a
           single character, but never the whole face of the object. */
        var box = a.size * (a.light ? 1.15 : 1.45);
        var w = box * k;
        var h = box * k * aspect;
        if (h > box * k) { h = box * k; w = h / aspect; }
        var x = a.x * k - w / 2;
        var y = a.y * k - h / 2;
        ctx.save();
        if (a.rot) {
          ctx.translate(a.x * k, a.y * k);
          ctx.rotate(a.rot * Math.PI / 180);
          ctx.translate(-a.x * k, -a.y * k);
        }
        if (a.light) {
          /* On the red impression the mark has to read as bare paper pressed
             into the ink — a 白文 impression, white lines on cinnabar. Painting
             cinnabar on cinnabar would be invisible, and painting a white box
             would show as a sticker.

             So the mark is used as a mask: a full-size canvas is flooded with
             paper colour, then destination-in keeps only the part of that
             flood the mark covers. What lands on the impression has the mark's
             own silhouette, edges and holes included. */
          var knock = document.createElement('canvas');
          knock.width = canvas.width;
          knock.height = canvas.height;
          var kx = knock.getContext('2d');
          kx.fillStyle = PAPER;
          kx.fillRect(0, 0, knock.width, knock.height);
          kx.globalCompositeOperation = 'destination-in';
          kx.drawImage(mut, x, y, w, h);
          ctx.globalAlpha = 0.94;
          ctx.drawImage(knock, 0, 0);
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = 0.94;
          ctx.drawImage(mut, x, y, w, h);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      });
      return canvas;
    }

    /* Name mode. The first anchor carries the name; any further anchors repeat
       the first two characters smaller — the seal's impression, the scroll's
       signature line. */
    var chars = glyphs(text, opts.layout, opts.maxChars);
    if (!chars.length) return canvas;

    list.forEach(function (a, idx) {
      var primary = idx === 0;
      var sub = primary ? chars : chars.slice(0, 2);

      /* A cut glyph sits in a recess with a shadow; a printed one does not.
         The anchor table says which, because the drawing knows. */
      var o = {
        fill: a.ink === 'cinnabar' ? CINNABAR : (a.light ? PAPER : INK),
        weight: primary ? 500 : 400,
        flat: a.mark === 'print',
        depth: a.mark === 'print' ? 0 : (primary ? undefined : 0.4)
      };
      if (a.light) o.light = true;

      /* The type size has to follow the anchor's real budget, not the sample's:
         the drawing cut one glyph at `a.size` into a recess that size + margin.
         Two glyphs at that size overrun it, so they scale down to fit. Without
         this, a two-character name on the seal spills onto the stone's edge. */
      var size = fitSize(sub, opts.layout, budgetFor(a, opts.layout, primary), a.size);

      var anchorPx = {
        x: a.x * k, y: a.y * k, size: size * k,
        arc: a.arc ? { cx: a.arc.cx, cy: a.arc.cy, r: a.arc.r } : null
      };
      /* art.cjs bends a fan's glyphs along the leaf; that is a horizontal row
         in effect, so a vertical layout request still follows the leaf. */
      var layout = a.arc && opts.layout !== 'single' ? 'arc' : opts.layout;

      ctx.save();
      if (a.rot) {
        ctx.translate(anchorPx.x, anchorPx.y);
        ctx.rotate(a.rot * Math.PI / 180);
        ctx.translate(-anchorPx.x, -anchorPx.y);
      }
      if (layout === 'single') {
        engrave(ctx, sub[0] || '', anchorPx.x, anchorPx.y, anchorPx.size, o);
      } else if (layout === 'arc') {
        engraveArc(ctx, sub, anchorPx, o);
      } else if (layout === 'horizontal') {
        engraveRow(ctx, sub, anchorPx, o);
      } else {
        engraveColumn(ctx, sub, anchorPx, o);
      }
      ctx.restore();
    });

    return canvas;
  }

  window.GiftCustomiser = {
    impression: impression,
    paint: paint,
    plate: plate,
    glyphs: glyphs
  };
})();
