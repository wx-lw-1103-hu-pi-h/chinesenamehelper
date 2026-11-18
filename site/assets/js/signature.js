/**
 * Calligraphy signature renderer.
 *
 * Plain canvas 2D, no fonts downloaded, no dependencies. Each style is a
 * different way of drawing the same three characters: the amount of slant,
 * the stroke weight curve, the join between strokes and the feathering at
 * entry and exit all change.
 *
 * Four styles, chosen because they are the four things people actually ask
 * for: something tidy, something fast, something formal, something dramatic.
 */
(function (root) {
  'use strict';

  var STYLES = {
    running:  { name: 'Running',  slope: 0.10, wBase: 5.2, wVar: 2.6, join: 0.72, feather: 0.55, gap: 0.02, italic: 0.06 },
    neat:     { name: 'Neat',     slope: 0.02, wBase: 4.4, wVar: 0.7, join: 0.35, feather: 0.18, gap: 0.10, italic: 0.00 },
    seal:     { name: 'Seal',     slope: 0.00, wBase: 6.6, wVar: 0.5, join: 0.22, feather: 0.10, gap: 0.14, italic: 0.00, uniform: true },
    wild:     { name: 'Wild',     slope: 0.20, wBase: 6.0, wVar: 4.4, join: 0.90, feather: 0.85, gap: -0.04, italic: 0.14 }
  };

  function font(size, style, weight) {
    /* A serif face is what carries the brush feel; every OS has one. */
    var stack = '"Songti SC","Source Han Serif SC","Noto Serif SC","STSong","SimSun",Georgia,serif';
    return (style === 'italic' ? 'italic ' : '') + (weight || 600) + ' ' + size + 'px ' + stack;
  }

  /**
   * Render a name into a canvas.
   * opts: { text, style, width, height, ink, paper, sealText }
   * Returns the canvas so the caller can export it.
   */
  function render(canvas, opts) {
    opts = opts || {};
    var st = STYLES[opts.style] || STYLES.running;
    var text = String(opts.text || '');
    var W = opts.width || 560;
    var H = opts.height || 190;
    var dpr = Math.min(root.devicePixelRatio || 1, 2.5);

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    /* Display size is fluid: an inline px height used to override the
       stylesheet's `height:auto`, so on a narrow screen the canvas was
       squeezed to 248px wide while staying 190px tall — a 2.26x vertical
       stretch. Let width drive and keep the intrinsic aspect ratio. */
    canvas.style.width = '100%';
    canvas.style.maxWidth = W + 'px';
    canvas.style.height = 'auto';

    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* paper */
    if (opts.paper !== false) {
      ctx.fillStyle = opts.paperColor || '#f6faf7';
      ctx.fillRect(0, 0, W, H);
    }

    var chars = Array.from(text);
    if (!chars.length) return canvas;

    var ink = opts.ink || '#17241f';
    /* size so the name fills the plate without touching the edges */
    var size = Math.min(H * 0.60, (W * 0.84) / chars.length) * 1.12;
    var n = chars.length;
    var advance = size * (1 + st.gap);
    var totalW = advance * n;
    var startX = (W - totalW) / 2 + advance * 0.06;
    var baseY = H * 0.5 + size * 0.36;

    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (var i = 0; i < n; i++) {
      var ch = chars[i];
      var x = startX + advance * i;
      /* each character tilts slightly more than the last: brush momentum */
      var tilt = st.slope * (i - (n - 1) / 2) * 0.085;
      var dy = Math.sin(i * 1.1) * size * 0.012 * (st === STYLES.wild ? 3.2 : 1);

      ctx.save();
      ctx.translate(x + size * 0.5, baseY + dy);
      ctx.rotate(-tilt);
      ctx.translate(-(size * 0.5), -size * 0.84);

      /* weighted under-layer gives the stroke thickness variation */
      if (!st.uniform && st.wVar > 0.9) {
        ctx.save();
        ctx.globalAlpha = 0.30;
        ctx.filter = 'blur(' + (size * 0.020) + 'px)';
        ctx.fillStyle = ink;
        ctx.font = font(size * 1.015, st.italic ? 'italic' : '', 700);
        ctx.fillText(ch, size * 0.055, size * 0.90);
        ctx.restore();
      }

      /* main stroke */
      ctx.fillStyle = ink;
      ctx.font = font(size, st.italic ? 'italic' : '', st.uniform ? 500 : 600);

      if (st.feather > 0.4) {
        /* a faint echo behind the character: the dry tail of a brush */
        ctx.save();
        ctx.globalAlpha = 0.13;
        ctx.filter = 'blur(' + (size * 0.030) + 'px)';
        ctx.fillText(ch, size * 0.055 + 1.4, size * 0.90 + 1.8);
        ctx.restore();
      }

      ctx.fillText(ch, size * 0.055, size * 0.90);

      /* entry stroke: a short lead-in that a real brush leaves behind */
      if (st.feather > 0.5) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(1, st.wBase * 0.28);
        ctx.beginPath();
        ctx.moveTo(size * 0.055 - size * 0.03, size * 0.86);
        ctx.quadraticCurveTo(size * 0.02, size * 0.72, size * 0.10, size * 0.62);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    /* seal, bottom right — a single character is enough to read as a stamp */
    if (opts.seal !== false) {
      var sealTxt = opts.sealText || chars[0] || '名';
      var ss = Math.min(H * 0.24, 46);
      var sx = W - ss - 20;
      var sy = H - ss - 16;
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.strokeStyle = opts.sealColor || '#b23a2a';
      ctx.lineWidth = Math.max(1.6, ss * 0.055);
      ctx.beginPath();
      roundRect(ctx, sx, sy, ss, ss, ss * 0.10);
      ctx.stroke();
      ctx.fillStyle = opts.sealColor || '#b23a2a';
      ctx.font = font(ss * 0.52, '', 600);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sealTxt, sx + ss / 2, sy + ss / 2 + ss * 0.02);
      ctx.restore();
    }

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function toPNG(canvas) {
    return canvas.toDataURL('image/png');
  }

  function download(canvas, filename) {
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename || 'chinese-name.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  root.Signature = { render: render, toPNG: toPNG, download: download, STYLES: STYLES };
})(typeof window !== 'undefined' ? window : globalThis);
