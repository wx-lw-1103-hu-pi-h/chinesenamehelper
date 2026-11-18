/**
 * The workshop panel on a carrier page.
 *
 * This is the part that answers "can I put my own thing on it". Three modes,
 * because there are exactly three honest answers:
 *
 *   name   — the visitor types characters, and they are engraved at the same
 *            anchor, in the same size, as the sample on the illustration.
 *   none   — nothing is cut. A bare stone or a blank scroll is a real order,
 *            and pretending it is not would be a worse page.
 *   motif  — the visitor uploads a picture, and it is pressed in as a seal
 *            mark. Not printed: reduced to one colour and cut in that shape.
 *
 * Why the preview is a canvas and not the illustration swapped for another
 * SVG: the visitor approves a picture before asking for a price, so the thing
 * they approve has to be the thing they can save and attach to the mail. One
 * render path, one artefact. GiftCustomiser does the drawing; this file owns
 * the controls, the debouncing, the file reading and the hand-off to the form.
 *
 * Everything visible is read from the bundle the page already loads, so a new
 * sentence is a bundle change, never a patch to two files.
 */
(function () {
  'use strict';

  var root = document.getElementById('cw');
  if (!root) return;

  var C = window.GiftCustomiser;
  if (!C) return;

  /* Carrier pages do not load the app's runtime bundle — their prose is baked
     into the HTML at build time. The workshop needs strings after a click, so
     the generator writes the handful it needs into an inline object. Reading
     them here keeps this file free of user-visible English. */
  var STR = window.CW_I18N || {};
  function t(key, vars) {
    var s = STR[key];
    if (typeof s !== 'string') return key;
    return s.replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? String(vars[k]) : m;
    });
  }

  var slug = root.getAttribute('data-slug') || '';
  var maxChars = parseInt(root.getAttribute('data-chars'), 10) || 2;
  var layout = root.getAttribute('data-layout') || 'vertical';
  var layoutName = root.getAttribute('data-layout-name') || layout;

  /* ---------- elements ---------- */
  var modeBtns = root.querySelectorAll('[data-mode]');
  var paneName = root.querySelector('[data-pane="name"]');
  var paneNone = root.querySelector('[data-pane="none"]');
  var paneMotif = root.querySelector('[data-pane="motif"]');
  var input = root.querySelector('#cw-text');
  var count = root.querySelector('#cw-count');
  var file = root.querySelector('#cw-file');
  var drop = root.querySelector('#cw-drop');
  var thumb = root.querySelector('#cw-thumb');
  var thumbWrap = root.querySelector('#cw-thumb-wrap');
  var err = root.querySelector('#cw-err');
  var canvas = root.querySelector('#cw-canvas');
  var downloadBtn = root.querySelector('#cw-download');
  var confirmBtn = root.querySelector('#cw-confirm');

  var state = {
    mode: 'name',
    text: '',
    motif: null,       /* canvas from GiftCustomiser.impression() */
    motifName: '',
    plate: null        /* loaded blank SVG */
  };

  /* ---------- helpers ---------- */

  function show(el, on) { if (el) el.hidden = !on; }

  function say(msg) {
    if (!err) return;
    err.textContent = msg || '';
    err.hidden = !msg;
  }

  function glyphCount(s) {
    return Array.from(String(s || '').replace(/\s+/g, '')).length;
  }

  /* The plate is fetched once per page: it is the carrier's own drawing with
     the sample glyph removed, so the preview sits in the real recess. */
  C.plate(slug, function (img) {
    state.plate = img;
    draw();
  });

  /* ---------- the preview ---------- */

  /* Width is chosen from the element's own CSS pixel width times the device
     ratio, capped: a proof saved at 2400px is a nicer file than a 700px one,
     but quadrupling every redraw on a slow phone to produce it is not. */
  function targetWidth() {
    var css = canvas ? canvas.clientWidth || 640 : 640;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    return Math.min(1600, Math.max(640, Math.round(css * dpr)));
  }

  function draw() {
    if (!canvas) return;
    var out = C.paint({
      slug: slug,
      plate: state.plate,
      width: targetWidth(),
      mode: state.mode,
      text: state.text,
      layout: layout,
      maxChars: maxChars,
      motif: state.motif
    });

    /* Copy the rendered pixels into the visible canvas rather than replacing
       the element: replacing it would lose the CSS sizing and force a reflow
       on every keystroke. */
    canvas.width = out.width;
    canvas.height = out.height;
    canvas.getContext('2d').drawImage(out, 0, 0);
  }

  /* Keystrokes arrive faster than a paint is worth doing. One frame of delay
     keeps typing smooth without making the preview feel lagged. */
  var pending = 0;
  function schedule() {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = 0;
      draw();
    });
  }

  /* ---------- mode ---------- */

  function setMode(mode) {
    state.mode = mode;
    Array.prototype.forEach.call(modeBtns, function (b) {
      var on = b.getAttribute('data-mode') === mode;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);
    });
    show(paneName, mode === 'name');
    show(paneNone, mode === 'none');
    show(paneMotif, mode === 'motif');
    say('');
    schedule();
  }

  Array.prototype.forEach.call(modeBtns, function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
  });

  /* ---------- name mode ---------- */

  if (input) {
    input.setAttribute('maxlength', String(maxChars * 2));   /* code units, loose */

    input.addEventListener('input', function () {
      var chars = Array.from(input.value.replace(/\s+/g, ''));
      if (chars.length > maxChars) {
        chars = chars.slice(0, maxChars);
        input.value = chars.join('');
      }
      state.text = input.value;
      if (count) {
        count.textContent = t('cw.count', { n: glyphCount(input.value), max: maxChars });
      }
      say('');
      schedule();
    });
  }

  /* ---------- motif mode ---------- */

  var MAX_BYTES = 8 * 1024 * 1024;
  var OK_TYPES = /^image\/(png|jpeg|jpg|gif|webp|svg\+xml)$/i;

  function readMotif(f) {
    if (!f) return;
    if (!OK_TYPES.test(f.type)) { say(t('cw.motif.err.type')); return; }
    if (f.size > MAX_BYTES) { say(t('cw.motif.err.size')); return; }

    say('');
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      var mark = C.impression(img);
      if (!mark) { say(t('cw.motif.err.type')); return; }

      /* impression() can legitimately produce an empty mark: a white page on a
         white background has nothing to press. Check the alpha channel rather
         than trusting the call to have succeeded — a blank preview with no
         explanation looks like the page is broken. */
      var d = mark.getContext('2d').getImageData(0, 0, mark.width, mark.height).data;
      var ink = 0;
      for (var i = 3; i < d.length; i += 4) { if (d[i] > 24) ink++; }
      if (!ink) { say(t('cw.motif.err.empty')); return; }

      state.motif = mark;
      state.motifName = f.name || '';
      if (thumb) {
        var tx = thumb.getContext('2d');
        var w = 96, h = Math.max(1, Math.round(w * mark.height / mark.width));
        thumb.width = w; thumb.height = h;
        tx.clearRect(0, 0, w, h);
        tx.drawImage(mark, 0, 0, w, h);
      }
      show(thumbWrap, true);
      schedule();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      say(t('cw.motif.err.type'));
    };
    img.src = url;
  }

  if (file) {
    file.addEventListener('change', function () { readMotif(file.files && file.files[0]); });
  }

  if (drop) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.add('is-over');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.remove('is-over');
      });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) readMotif(f);
    });
  }

  /* ---------- export ---------- */

  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      /* A proof is worth saving as soon as it exists; a canvas that has not been
         drawn yet would export a blank PNG. */
      draw();
      var name = slug + (state.mode === 'motif' ? '-mark' : state.mode === 'none' ? '-plain' : '-' + (state.text || 'name'));
      try {
        var a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = name.replace(/[\\/:*?"<>|]/g, '') + '.png';
        a.click();
      } catch (e) {
        /* toDataURL throws on a tainted canvas. The only tainting source here
           would be a cross-origin motif, which impression() already refuses. */
        say(t('cw.motif.err.type'));
      }
    });
  }

  /* ---------- hand-off to the enquiry form ---------- */

  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      var form = document.getElementById('gift-form');
      if (!form) return;

      /* The form is the record of the order; the preview is the attachment.
         Fill the text field the form already has, and leave a block of detail
         the buyer can read and the workshop can act on. */
      var cn = form.querySelector('#gf-cn');
      var msg = form.querySelector('#gf-msg');

      if (cn && state.mode === 'name' && state.text) cn.value = state.text;

      var lines = [];
      lines.push('Customisation: ' + state.mode);
      if (state.mode === 'name') {
        lines.push('Characters: ' + state.text);
        lines.push('Layout: ' + layoutName);
      } else if (state.mode === 'motif') {
        lines.push('Motif file: ' + (state.motifName || '(unnamed)'));
        lines.push('I have saved the proof and will attach it.');
      } else {
        lines.push('No engraving.');
      }

      if (msg) {
        var prev = msg.value.trim();
        msg.value = (prev ? prev + '\n\n' : '') + '--- from the workshop ---\n' + lines.join('\n');
      }

      var enquire = document.getElementById('enquire');
      if (enquire) {
        enquire.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var first = form.querySelector('#gf-name');
        if (first) setTimeout(function () { first.focus(); }, 420);
      }
    });
  }

  /* ---------- boot ---------- */

  if (count) count.textContent = t('cw.count', { n: 0, max: maxChars });
  setMode('name');
})();
