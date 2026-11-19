/**
 * Naming engine.
 *
 * Deliberately deterministic: the same inputs always produce the same set,
 * so a result can be shared by URL. "Regenerate" bumps a seed instead.
 *
 * Two independent signals drive character choice:
 *   1. Birth chart (八字) weakness — which of the five elements is thin.
 *   2. Zodiac branch element — what the birth year's branch supports.
 * Both are traditional heuristics, and the UI says so plainly rather than
 * claiming to be a full 命理 consultation.
 */
(function (root) {
  'use strict';

  /* ---------- deterministic RNG ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- self-description -> character tags ---------- */
  /* Ordered: earlier patterns win when several could match. */
  var KEYWORDS = [
    [/\b(calm|quiet|peace|peaceful|still|serene|zen|chill|relax)\b/, ['calm', 'peace']],
    [/\b(brave|courage|fearless|bold|strong|strength|warrior|fight)\b/, ['resolve', 'steadfast', 'energy']],
    [/\b(wise|wisdom|smart|clever|thoughtful|think|curious|curiosity|philosoph)\b/, ['wisdom', 'mind', 'thoughtful']],
    [/\b(creativ|artist|artistic|imaginat|design|invent|idea)\b/, ['talent', 'free', 'letters']],
    [/\b(kind|gentle|warm|caring|compassion|sweet|soft|humble|modest)\b/, ['warmth', 'gentle', 'good', 'humble']],
    [/\b(ambitious|ambition|driven|goal|achiev|success|determin)\b/, ['ambition', 'summit', 'horizon']],
    [/\b(free|independent|travel|adventure|wander|explore|journey)\b/, ['free', 'voyage', 'flow', 'horizon']],
    [/\b(honest|sincere|loyal|trust|integrity|truth|faithful)\b/, ['sincere', 'trust', 'upright']],
    [/\b(elegant|refine|classic|tasteful|grace|sophisticat|aesthetic)\b/, ['elegant', 'refined', 'classic', 'cultured']],
    [/\b(bright|sunny|cheer|happy|optimis|joy|light|glow|positive)\b/, ['light', 'joy', 'dawn', 'brilliant']],
    [/\b(deep|introspect|reflect|mysteri|profound)\b/, ['depth', 'thoughtful', 'wisdom']],
    [/\b(nature|mountain|sea|ocean|river|forest|tree|moon|star|sky|flower|garden)\b/, ['nature', 'steadfast', 'flow', 'vast']],
    [/\b(beautif|pretty|lovely|charm|attract)\b/, ['beauty', 'jade', 'elegant']],
    [/\b(resilien|persist|never give|grit|endure|patient|patience)\b/, ['endurance', 'resolve', 'steady']],
    [/\b(leader|confiden|dexive|vision|command)\b/, ['ambition', 'upright', 'grand']],
    [/\b(scholar|academ|study|learn|intellectual|read|book|poet|literat|write)\b/, ['letters', 'learning', 'cultured', 'mind']],
    [/\b(music|song|melody|dance)\b/, ['cultured', 'joy', 'flow']],
    [/\b(balance|harmon|centred|centered|middle|moderat)\b/, ['harmony', 'balance']],
    [/\b(family|home|belong|root|heritage|tradition)\b/, ['safety', 'warmth', 'heritage', 'peace']],
    [/\b(luck|fortunate|blessing|prosper|abundan|wealth)\b/, ['auspicious', 'prosperity', 'glory']],
    [/\b(health|vital|energy|vigor|alive)\b/, ['health', 'energy', 'auspicious']],
    [/\b(jade|gem|jewel|pearl|crystal)\b/, ['jade', 'beauty']],
    [/\b(funny|humor|playful|fun|laugh|wit)\b/, ['joy', 'talent', 'free']],
    [/\b(journey|pilgrim|path|way)\b/, ['voyage', 'flow', 'horizon']],
    [/\b(justice|fair|right|principle|moral)\b/, ['justice', 'upright', 'virtue']]
  ];

  var DEFAULT_TAGS = ['light', 'wisdom', 'calm', 'nature'];

  function parseTags(text) {
    if (!text) return DEFAULT_TAGS.slice();
    var t = ' ' + String(text).toLowerCase() + ' ';
    var out = [], seen = {};
    KEYWORDS.forEach(function (pair) {
      if (!pair[0].test(t)) return;
      pair[1].forEach(function (tag) {
        if (!seen[tag]) { seen[tag] = 1; out.push(tag); }
      });
    });
    return out.length ? out : DEFAULT_TAGS.slice();
  }

  /* ---------- lunar / bazi ---------- */
  /* lunar-javascript's UMD wrapper flattens its exports onto window, so the
     globals are Solar / Lunar / LunarUtil side by side — there is no
     Lunar.Solar. Prefer the namespaced object when a bundler is used. */
  function solarClass() {
    if (root.Solar && root.Solar.fromYmd) return root.Solar;
    if (root.lunarjs && root.lunarjs.Solar) return root.lunarjs.Solar;
    if (root.Lunar && root.Lunar.Solar) return root.Lunar.Solar; /* bundled */
    return null;
  }
  var ZODIAC_ELEM = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
  };
  var STEM_ELEM = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
  };
  /* 生 relationship: what each element generates (相生). */
  var GENERATES = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  var ALL_ELEMENTS = ['木', '火', '土', '金', '水'];

  var ZODIAC_INFO = {
    '鼠': { en: 'Rat', elem: '水', trait: 'quick-witted, resourceful, adaptable' },
    '牛': { en: 'Ox', elem: '土', trait: 'patient, dependable, quietly stubborn' },
    '虎': { en: 'Tiger', elem: '木', trait: 'bold, competitive, protective' },
    '兔': { en: 'Rabbit', elem: '木', trait: 'gentle, observant, diplomatic' },
    '龙': { en: 'Dragon', elem: '土', trait: 'charismatic, ambitious, unafraid' },
    '蛇': { en: 'Snake', elem: '火', trait: 'perceptive, private, deliberate' },
    '马': { en: 'Horse', elem: '火', trait: 'energetic, open, always moving' },
    '羊': { en: 'Goat', elem: '土', trait: 'artistic, mild, quietly determined' },
    '猴': { en: 'Monkey', elem: '金', trait: 'inventive, playful, fast on its feet' },
    '鸡': { en: 'Rooster', elem: '金', trait: 'precise, hardworking, candid' },
    '狗': { en: 'Dog', elem: '土', trait: 'loyal, fair-minded, steady' },
    '猪': { en: 'Pig', elem: '水', trait: 'generous, sincere, enjoys comfort' }
  };

  /**
   * Compute chart facts for a Gregorian date.
   * Returns null when the lunar library is unavailable so the UI can degrade
   * to a description-only name rather than break.
   */
  function computeBirth(y, m, d, hour) {
    var SolarCls = solarClass();
    var res = {
      ok: false, solar: null, lunarText: '', zodiac: '', zodiacEn: '',
      zodiacElem: '', bazi: [], elementCount: {}, weak: [], support: [],
      dayMaster: '', hourKnown: hour !== null && hour !== undefined
    };

    /* element totals need the chart; without it fall back to zodiac year only */
    if (!SolarCls) return res;

    try {
      var solar = SolarCls.fromYmd(y, m, d);
      var lunar = solar.getLunar();
      res.ok = true;
      res.solar = y + '-' + pad(m) + '-' + pad(d);
      res.lunarText = lunar.getYearInChinese() + '年' + lunar.getMonthInChinese() + '月' +
        lunar.getDayInChinese();
      res.zodiac = lunar.getYearShengXiao();
      var zi = ZODIAC_INFO[res.zodiac];
      if (zi) { res.zodiacEn = zi.en; res.zodiacElem = zi.elem; res.zodiacTrait = zi.trait; }

      var ec = lunar.getEightChar();
      var pillars = [
        { label: 'year', text: ec.getYear() },
        { label: 'month', text: ec.getMonth() },
        { label: 'day', text: ec.getDay() },
        { label: 'hour', text: res.hourKnown ? ec.getTime() : '' }
      ];
      var count = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
      pillars.forEach(function (p) {
        if (!p.text || p.text.length < 2) { p.stems = []; return; }
        p.stems = [STEM_ELEM[p.text[0]], ZODIAC_ELEM[p.text[1]]];
        p.stems.forEach(function (e) { if (e && count[e] !== undefined) count[e]++; });
      });
      res.bazi = pillars;
      res.elementCount = count;
      res.dayMaster = ec.getDayGan ? ec.getDayGan() : '';

      /* Weakest elements: those with the lowest count, at most two.
         Traditional naming supplements the thin element; this is the
         simplified version of that rule, not a full 喜用神 reading. */
      var sorted = ALL_ELEMENTS.slice().sort(function (a, b) { return count[a] - count[b]; });
      var min = count[sorted[0]];
      res.weak = sorted.filter(function (e) { return count[e] === min; }).slice(0, 2);

      /* The zodiac branch also supports the element it generates. */
      if (res.zodiacElem) {
        res.support = [res.zodiacElem];
        var gen = GENERATES[res.zodiacElem];
        if (gen) res.support.push(gen);
      }
    } catch (e) {
      res.ok = false;
    }
    return res;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- library ---------- */
  function library() {
    var raw = [].concat(root.HANZI || [], root.HANZI2 || []);
    var seen = {}, out = [];
    raw.forEach(function (c) {
      if (!c || seen[c.c]) return;
      seen[c.c] = 1;
      c.tagSet = {};
      (c.tags || []).forEach(function (t) { c.tagSet[t] = 1; });
      out.push(c);
    });
    return out;
  }

  /* ---------- scoring ---------- */
  function scoreChar(ch, ctx) {
    var s = 0;
    /* element need: the strongest signal we have */
    if (ctx.weak.indexOf(ch.wx) >= 0) s += 34;
    else if (ctx.support.indexOf(ch.wx) >= 0) s += 16;

    /* meaning match against the self-description */
    var hits = 0;
    ctx.wanted.forEach(function (t) { if (ch.tagSet[t]) hits++; });
    s += Math.min(hits, 3) * 13;

    /* gender lean: strong match rewards, hard mismatch penalises */
    if (ctx.gender === 'neutral') s += ch.g === 'n' ? 8 : 3;
    else if (ch.g === ctx.gender) s += 14;
    else if (ch.g === 'n') s += 7;
    else s -= 11;

    /* a name should be sayable without effort */
    if (ch.s > 17) s -= 6;
    if (ch.s <= 5) s += 3;

    /* small stable jitter so results are not always the same five chars */
    s += ctx.rnd() * 9;
    return s;
  }

  /*
   * Attested given names. Two characters that each score well can still read
   * like a dictionary entry rather than a person — 通信 (telecom), 宁通, 舟洛.
   * This list is the empirical fix: pairings that real families actually use.
   * It is a quality signal, not a ranking signal.
   */
  var ATTESTED = {};
  ('志远 志强 志明 志伟 志豪 志诚 浩宇 昊天 昊宇 浩然 浩宇 天宇 天佑 天磊 天翔 ' +
   '子轩 子墨 子涵 子瑜 子骞 明轩 明哲 明远 明辉 明诚 俊杰 俊熙 俊宇 俊豪 ' +
   '嘉诚 嘉豪 嘉怡 嘉欣 嘉宁 嘉言 家豪 家宁 家怡 静怡 静姝 静雅 静安 静文 ' +
   '思远 思齐 思聪 思涵 思雨 思琪 雨轩 雨桐 雨欣 雨薇 若曦 若彤 若轩 ' +
   '文轩 文博 文韬 文昊 文清 文君 文倩 文静 文雅 书瑶 书宁 书哲 书航 ' +
   '雅静 雅涵 雅琴 雅妍 雅楠 雅琳 雅欣 婉清 婉宁 婉如 婉婷 婉秋 ' +
   '晓明 晓峰 晓东 晓燕 晓彤 晓雯 晓琳 晓玲 晓静 晓雨 晓宇 晓阳 ' +
   '一鸣 一诺 一帆 一凡 一涵 一鸣 奕辰 奕帆 奕博 奕萱 奕欣 ' +
   '佳怡 佳明 佳慧 佳宁 佳敏 佳琪 佳欣 佳颖 佳音 佳期 ' +
   '悠然 悠宁 悠远 悠然 欣怡 欣然 欣悦 欣妍 欣妍 悦然 悦宁 悦心 悦彤 ' +
   '海涛 海燕 海宁 海峰 海龙 海生 海清 海川 海明 海洲 ' +
   '立诚 立德 立功 立言 立新 立平 立群 立志 立国 立民 ' +
   '景明 景行 景天 景文 景华 景怡 景宁 景和 ' +
   '承志 承恩 承德 承宇 承泽 承霖 承翰 ' +
   '晨阳 晨光 晨熙 晨曦 晨宇 晨浩 晨宁 晨露 晨星 ' +
   '紫涵 紫萱 紫薇 紫晴 紫琳 紫瑜 紫嫣 ' +
   '梓涵 梓萱 梓晴 梓琳 梓瑜 梓宁 梓轩 梓豪 梓航 ' +
   '清扬 清婉 清荷 清宁 清远 清和 清朗 清源 清越 清妍 ' +
   '正德 正阳 正明 正阳 正轩 正义 ' +
   '元贞 元朗 元君 元亨 元楷 ' +
   '永康 永强 永宁 永年 永嘉 永熙 永昌 永泰 永和 永平 永立 永信 永达 ' +
   '启迪 启明 启航 启文 启航 启元 启帆 ' +
   '安然 安平 安庆 安和 安祥 安琪 安琪 安莉 安欣 ' +
   '康宁 康平 康健 康成 康乐 ' +
   '泰安 泰和 泰宁 泰康 泰然 ' +
   '和畅 和风 和平 和美 和顺 和宁 ' +
   '达文 达理 达明 达夫 达观 达远 ' +
   '通达 通远 通海 通文 ' +
   '迪文 迪宇 迪安 ' +
   '卓远 卓然 卓文 卓轩 卓君 卓群 ' +
   '怀远 怀德 怀宁 怀文 怀瑾 ' +
   '慈恩 慈宁 ' +
   '诚明 诚正 诚朴 诚心 ' +
   '敬之 敬和 敬明 敬文 ' +
   '恭和 恭明 ' +
   '惠宁 惠文 惠民 惠然 惠美 ' +
   '善行 善宁 善文 善和 ' +
   '谦和 谦益 谦之 谦明 谦光 ' +
   '嘉禾 嘉良 嘉则 嘉运 嘉谊 ' +
   '福宁 福海 福民 福生 福来 ' +
   '荣光 荣华 荣昌 荣达 荣文 荣和 ' +
   '瑞兴 瑞华 瑞宁 瑞光 瑞昌 瑞祥 瑞芳 瑞安 ' +
   '华清 华年 华美 华光 华章 华英 ' +
   '玉兰 玉梅 玉洁 玉芬 玉珍 玉珊 玉辉 玉华 玉琳 ' +
   '天佑 佑宁 佑安 ' +
   '泽霖 泽宇 泽民 泽文 泽远 泽华 泽航 ' +
   '润泽 润德 润之 润物 润生 ' +
   '林峰 林泉 林海 林轩 林木 ' +
   '松涛 松林 松泉 松云 松声 松年 ' +
   '若水 若冰 若愚 若清 若松 ' +
   '怀玉 佩玉 玉成 ' +
   '怀瑾 握瑜 瑾瑜 ').split(' ').forEach(function (x) { if (x) ATTESTED[x] = 1; });

  /*
   * Pairings that read as ordinary vocabulary, not as a name.
   * 通信 (telecommunications) is the classic failure: both characters are
   * fine in isolation, the compound is a utility company.
   */
  var BLOCKED = {};
  ('通信 消息 通知 部门 中心 大小 中性 中间 大学 学校 中文 汉字 书法 ' +
   '风雨 山水 日月 星辰 天地 光明 明亮 清白 高低 上下 左右 东西 ' +
   '文化 文明 学生 生活 生日 工作 时间 空间 水平 平等 数学 语文 ' +
   '大海 山河 山路 水边 门口 东西 南北 春秋 冬夏 天下 大道 道德 ' +
   '雅正 正雅 文文 明明 天天 心心 美美 好好 安安 宁宁 静静 平平 ' +
   '成功 成果 成绩 力量 能力 助手 手段 方法 方式 方向 目标 计划 ' +
   '通达 达通 通通 达达 大通 通大 中通 通中 小通 通小 ' +
   '子女 儿女 子孙 子孙 夫妻 夫妇 朋友 兄弟 姐妹 父母 家庭 ' +
   '金石 金玉 木石 水土 火气 水气 气气 木木 火火 土土 金金 水水').split(' ')
    .forEach(function (x) { if (x) BLOCKED[x] = 1; });

  /* Characters that almost never lead a given name on their own. */
  var WEAK_LEAD = { '大': 1, '中': 1, '小': 1, '通': 1, '有': 1, '无': 1 };

  /* Pair-level checks that a per-character score cannot see. */
  function pairPenalty(a, b) {
    var p = 0;
    var pair = a.c + b.c;
    if (a.c === b.c) p += 100;
    if (BLOCKED[pair]) p += 260;
    if (a.t === b.t) p += 14;                  /* flat tone is hard to say */
    if (a.wx === b.wx) p += 9;                 /* stacking one element */
    if (a.s + b.s > 34) p += 8;                /* visually heavy */
    if (a.s + b.s < 13) p += 4;                /* too sparse */
    if (Math.abs(a.s - b.s) > 11) p += 4;      /* lopsided */
    if (WEAK_LEAD[a.c]) p += 18;               /* 大/中 read like qualifiers */
    /* avoid alliteration with the surname when we know its sound */
    if (a.p && b.p && a.p === b.p) p += 10;
    return p;
  }

  /**
   * Turn the internal ranking score into a 0-100 number a visitor can read.
   *
   * The raw total is a ranking device — its units are meaningless outside the
   * sort. Dividing it by a magic constant (the previous approach) produced a
   * ring that said 51% next to the number 81. This decomposes the same inputs
   * into four shares that add up to 1, so the ring and the number agree:
   *   element  — does the name supply what the chart is short of?
   *   meaning  — how much of the description the pair actually covers?
   *   sound    — how many awkwardness rules the pair had to break?
   *   gender   — is it a name for the person we are naming?
   * Genuine name pairings get a small lift, because "sounds like a real
   * person" is a quality nobody can measure but everybody notices.
   *
   * This decomposition is honest about all four ingredients, but the ring is
   * derived after ranking and clamped, so it can never contradict the rank.
   */
  function fitOf(pr, ctx) {
    var chars = [pr.a, pr.b];

    var elem;
    if (ctx.weak.length || ctx.support.length) {
      var sum = 0;
      chars.forEach(function (c) {
        sum += ctx.weak.indexOf(c.wx) >= 0 ? 1 : (ctx.support.indexOf(c.wx) >= 0 ? 0.55 : 0.12);
      });
      elem = sum / 2;
    } else {
      /* no birth date: score it as neutral rather than as a failure */
      elem = 0.62;
    }

    var meaning;
    if (ctx.wanted.length) {
      var got = {};
      chars.forEach(function (c) {
        if (!c.tagSet) return;
        Object.keys(c.tagSet).forEach(function (t) {
          if (ctx.wanted.indexOf(t) >= 0) got[t] = 1;
        });
      });
      meaning = Math.min(1, Object.keys(got).length / Math.min(ctx.wanted.length, 2));
    } else {
      meaning = 0.6;
    }

    var sound = Math.max(0, 1 - pr.penalty / 70);
    if (ATTESTED[pr.a.c + pr.b.c]) sound = Math.min(1, sound + 0.22);

    var gender;
    if (ctx.gender === 'n') gender = 0.82;
    else {
      var right = 0;
      chars.forEach(function (c) {
        right += c.g === ctx.gender ? 1 : (c.g === 'n' ? 0.72 : 0);
      });
      gender = right / 2;
    }

    var fit = 0.40 * elem + 0.22 * meaning + 0.24 * sound + 0.14 * gender;
    return Math.round(Math.max(38, Math.min(99, fit * 100)));
  }

  /**
   * Produce ranked 2-character given names.
   * opts: { surname, gender, year, month, day, hour, desc, seed, avoid, count }
   * `avoid` is a list of given names the visitor has already been shown; they
   * are skipped so "another set" actually produces a different set.
   */
  function generate(opts) {
    opts = opts || {};
    var lib = library();
    if (!lib.length) return { names: [], chart: null };

    var gender = opts.gender === 'female' ? 'f' : opts.gender === 'male' ? 'm' : 'n';
    var chart = null;
    if (opts.year && opts.month && opts.day) {
      chart = computeBirth(opts.year, opts.month, opts.day,
        opts.hour === '' || opts.hour === undefined ? null : opts.hour);
    }
    if (!chart) chart = { ok: false, weak: [], support: [], elementCount: {}, hourKnown: false };

    var ctx = {
      weak: chart.weak || [],
      support: chart.support || [],
      wanted: parseTags(opts.desc),
      gender: gender,
      rnd: mulberry32((opts.seed || 1) * 2654435761 % 4294967296)
    };

    var scored = lib.map(function (ch) {
      return { ch: ch, s: scoreChar(ch, ctx) };
    }).sort(function (x, y) { return y.s - x.s; });

    /* A name consumes two characters and no character repeats inside a batch.
       Drawing from a fixed 34-character top pool dried up after three batches:
       each draw used ten glyphs, so the same letters kept coming back. Draw
       from the whole library instead, and let the freshness score below steer
       the visitor towards what they have not seen yet. */
    var avoidList = (opts.avoid || []).filter(Boolean);
    var freq = {};
    avoidList.forEach(function (g) {
      Array.from(g).forEach(function (c) { freq[c] = (freq[c] || 0) + 1; });
    });

    var pool = scored.map(function (x) { return x.ch; });
    var charScore = {};
    scored.forEach(function (x) { charScore[x.ch.c] = x.s; });

    var pairs = [];
    for (var i = 0; i < pool.length; i++) {
      for (var j = 0; j < pool.length; j++) {
        if (i === j) continue;
        var a = pool[i], b = pool[j];
        var pen = pairPenalty(a, b);
        var pr = { a: a, b: b, penalty: pen };
        /* attested pairings get a real boost — they are what people expect */
        var bonus = ATTESTED[a.c + b.c] ? 26 : 0;
        /* Characters the visitor has not met yet outrank ones already shown,
           otherwise widening the pool only re-deals the same top names. The
           penalty deepens with every repeat but is capped, so "never repeat"
           stays a tie-breaker instead of overpowering name quality deep into
           a long session. */
        var reuse = (freq[a.c] || 0) + (freq[b.c] || 0);
        var fresh = reuse === 0 ? 40 : -Math.min(reuse, 4) * 6;
        pr.total = charScore[a.c] + charScore[b.c] * 0.92 - pen + bonus + fresh - ctx.rnd() * 0.5;
        pairs.push(pr);
      }
    }
    /* Rank by the quality total, which already folds in "reads like a real
       name". The readable score is derived afterwards, not used to sort. */
    pairs.sort(function (x, y) { return y.total - x.total; });

    /* Deduplicate: no character may appear in more than one returned name,
       otherwise a five-name list only offers three real choices. */
    var used = {}, picked = [];
    var avoid = {};
    avoidList.forEach(function (g) { avoid[g] = 1; });
    for (var k = 0; k < pairs.length && picked.length < (opts.count || 5); k++) {
      var pr = pairs[k];
      if (used[pr.a.c] || used[pr.b.c]) continue;
      if (pr.penalty >= 60) continue;
      if (avoid[pr.a.c + pr.b.c]) continue;
      used[pr.a.c] = 1; used[pr.b.c] = 1;
      picked.push(pr);
    }

    /* Never hand back an empty list just because the good pairs were seen:
       relax the exclusion and reuse the top of the pool. */
    if (!picked.length && Object.keys(avoid).length) {
      opts.avoid = [];
      return generate(opts);
    }

    var surname = opts.surname || '';

    /* One readable 0-100 number per name for the ring. Each value comes from
       its own pair, but the display must not contradict the ranking — a name
       ranked 4 with a fuller ring than rank 1 reads as a bug. Isotonic
       regression (pool adjacent violators) enforces non-increasing order while
       keeping as much of the real spread as possible: genuinely equal pairs
       collapse to one number, genuinely different ones stay different. */
    var raw = picked.map(function (pr) { return fitOf(pr, ctx); });
    var block = raw.map(function (v) { return { sum: v, n: 1 }; });
    for (var bi = 1; bi < block.length; bi++) {
      while (bi > 0 && block[bi - 1].sum / block[bi - 1].n < block[bi].sum / block[bi].n) {
        block[bi - 1].sum += block[bi].sum;
        block[bi - 1].n += block[bi].n;
        block.splice(bi, 1);
        bi--;
      }
    }
    var fitted = [];
    block.forEach(function (b) {
      var v = Math.round(b.sum / b.n);
      for (var q = 0; q < b.n; q++) fitted.push(v);
    });
    picked.forEach(function (pr, idx) { pr.fit = fitted[idx]; });

    return {
      chart: chart,
      wanted: ctx.wanted,
      names: picked.map(function (pr, idx) {
        var chars = [pr.a, pr.b];
        return {
          rank: idx + 1,
          surname: surname,
          given: pr.a.c + pr.b.c,
          full: surname + pr.a.c + pr.b.c,
          pinyin: chars.map(function (c) { return c.p; }).join(' '),
          score: Math.round(pr.total),
          fit: pr.fit,
          chars: chars.map(function (c) {
            return {
              c: c.c, p: c.p, tone: c.t, strokes: c.s, element: c.wx,
              meaning: c.m, book: c.book, line: c.line, lineEn: c.lineEn,
              west: c.west, note: c.note, tags: c.tags
            };
          }),
          /* Short rationale as data, not as a sentence. The page owns the
             wording, so /pt/ and /ko/ can say the same thing in their own
             language instead of printing an English sentence built here. */
          why: buildWhy(chars, ctx, chart)
        };
      })
    };
  }

  function buildWhy(chars, ctx, chart) {
    var elems = chars.map(function (c) { return c.wx; });
    var hitsWeak = elems.filter(function (e) { return ctx.weak.indexOf(e) >= 0; });
    var hitsSup = elems.filter(function (e) { return ctx.support.indexOf(e) >= 0; });
    /* say it once: "adds fire and fire" reads like a bug */
    hitsWeak = hitsWeak.filter(function (e, i, arr) { return arr.indexOf(e) === i; });
    hitsSup = hitsSup.filter(function (e, i, arr) { return arr.indexOf(e) === i; });

    var shared = [];
    chars.forEach(function (c) {
      (c.tags || []).forEach(function (t) {
        if (ctx.wanted.indexOf(t) >= 0 && shared.indexOf(t) < 0) shared.push(t);
      });
    });

    return {
      weak: hitsWeak,
      support: hitsSup,
      tags: shared.slice(0, 3),
      tonesDiffer: chars[0].t !== chars[1].t
    };
  }

  root.NamingEngine = {
    generate: generate,
    computeBirth: computeBirth,
    parseTags: parseTags,
    library: library,
    ZODIAC_INFO: ZODIAC_INFO,
    ALL_ELEMENTS: ALL_ELEMENTS
  };
})(typeof window !== 'undefined' ? window : globalThis);
