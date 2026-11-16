/* D5 Arco 产品首页 · V7（本地预览）
   无依赖、无网络请求。所有交互都是渐进增强：脚本不可用时页面内容仍完整可读。 */
(() => {
  'use strict';
  const doc = document, root = doc.documentElement;
  root.classList.add('js');
  const $ = (s, c = doc) => c.querySelector(s);
  const $$ = (s, c = doc) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => mqReduce.matches;
  const headerH = () => parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 64;
  const el = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const raf = fn => { let t = 0; return (...a) => { if (t) return; t = requestAnimationFrame(() => { t = 0; fn(...a); }); }; };

  /* ---------------- 顶栏与移动菜单 ---------------- */
  (function header() {
    const header = $('[data-header]'), toggle = $('[data-menu-toggle]'), menu = $('[data-menu]');
    if (!header) return;
    const onScroll = raf(() => header.classList.toggle('is-scrolled', window.scrollY > 8));
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    const links = $$('.site-nav a');
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { const a = byId.get(e.target.id); if (!a) return; if (e.isIntersecting) { links.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); } else if (a.getAttribute('aria-current')) a.removeAttribute('aria-current'); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      byId.forEach((a, id) => { const s = doc.getElementById(id); if (s) io.observe(s); });
    }

    if (!toggle || !menu) return;
    const main = $('#main'), footer = $('.site-footer');
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    function setOpen(open, focusToggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      menu.hidden = !open;
      root.classList.toggle('menu-open', open);
      [main, footer].forEach(n => { if (n) { if (open) n.setAttribute('inert', ''); else n.removeAttribute('inert'); } });
      if (open) { const first = $('a', menu); if (first) first.focus(); } else if (focusToggle) toggle.focus();
    }
    toggle.addEventListener('click', () => setOpen(!isOpen(), true));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false, false); });
    doc.addEventListener('keydown', e => {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false, true); return; }
      if (e.key !== 'Tab') return;
      const f = [toggle, ...$$('a,button', menu)], i = f.indexOf(doc.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches && isOpen()) setOpen(false, false); });
  })();

  /* ---------------- 进入视口时显现 ---------------- */
  (function reveal() {
    const items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { items.forEach(n => n.classList.add('is-in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(n => io.observe(n));
  })();

  /* ---------------- 画布叙事：镜头在官方演示项目上移动 ---------------- */
  (function story() {
    const story = $('[data-story]'), dataEl = $('#story-data');
    if (!story || !dataEl) return;
    let data; try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    const cv = $('[data-cv]', story), world = $('[data-world]', story), panel = $('[data-panel]', story), app = $('[data-app]', story), pin = $('[data-pin]', story);
    const steps = $$('.step', story), dots = $$('.dot', story), prev = $('[data-prev]', story), next = $('[data-next]', story), zoomVal = $('[data-zoom-val]', story), tools = $('.cv-tools', cv);
    const order = $$('.nd', world), nodeEls = {}; order.forEach(n => { nodeEls[n.dataset.node] = n; });
    const setTabStop = key => order.forEach(n => { n.tabIndex = n.dataset.node === key ? 0 : -1; });
    const edgeEls = {}; $$('[data-edge]', world).forEach(p => { edgeEls[p.dataset.edge] = p; });
    const W = data.world.w, H = data.world.h, N = data.nodes, S = data.states;
    const THR = [0, 0.07, 0.29, 0.51, 0.73, 0.91];
    const TAG = 170; // 节点上方标签与连线占用的世界单位
    let geo = null, state = 0, inspect = null, zoomMul = 1, live = false, settled = false;

    function measure() {
      const cw = cv.clientWidth, ch = cv.clientHeight; if (!cw || !ch) return false;
      const mobile = cw < 640, hasTools = tools && getComputedStyle(tools).display !== 'none';
      const inset = mobile ? { l: 10, r: 10, t: 10, b: 46 } : { l: hasTools ? 62 : 16, r: 16, t: 12, b: 52 };
      const aw = cw - inset.l - inset.r, ah = ch - inset.t - inset.b, k0 = Math.min(aw / W, ah / H), bw = W * k0, bh = H * k0;
      geo = { cw, ch, mobile, inset, k0, left: inset.l + (aw - bw) / 2, top: inset.t + (ah - bh) / 2 };
      world.style.width = bw + 'px'; world.style.height = bh + 'px'; world.style.left = geo.left + 'px'; world.style.top = geo.top + 'px';
      world.style.setProperty('--u', k0.toFixed(5));
      return true;
    }
    function bbox(keys) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      keys.forEach(k => { const n = N[k]; x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y - TAG); x1 = Math.max(x1, n.x + n.w); y1 = Math.max(y1, n.y + n.h); });
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    function camera(focus, withPanel) {
      const g = geo, safe = { x: g.inset.l, y: g.inset.t, w: g.cw - g.inset.l - g.inset.r, h: g.ch - g.inset.t - g.inset.b };
      if (withPanel) { if (g.mobile) safe.h -= (panel.offsetHeight || g.ch * 0.36) + 4; else safe.w -= (panel.offsetWidth || 312) + 14; }
      let k, tx, ty;
      if (focus === 'wide') { k = safe.w / W; tx = safe.x - g.left; ty = safe.y - g.top; }
      else if (focus === 'all' && g.mobile) { // 手机竖屏放不下横向画布：按高度铺满，由 survey() 左右巡视
        k = safe.h / H; tx = safe.x - g.left; ty = safe.y - g.top;
        return { k, tx, ty, pan: Math.max(0, W * k - safe.w) };
      }
      else {
        const bb = focus === 'all' ? { x: 0, y: 0, w: W, h: H } : bbox(focus), fill = focus === 'all' ? 1 : (g.mobile ? 0.9 : 0.86);
        k = Math.min(safe.w * fill / bb.w, safe.h * fill / bb.h, g.mobile ? 0.52 : 0.62);
        tx = safe.x + safe.w / 2 - g.left - (bb.x + bb.w / 2) * k; ty = safe.y + safe.h / 2 - g.top - (bb.y + bb.h / 2) * k;
      }
      if (zoomMul !== 1) { // 以安全区中心为锚点缩放
        const cx = safe.x + safe.w / 2 - g.left, cy = safe.y + safe.h / 2 - g.top, wx = (cx - tx) / k, wy = (cy - ty) / k;
        k *= zoomMul; tx = cx - wx * k; ty = cy - wy * k;
      }
      return { k, tx, ty };
    }
    let surveyAnim = null;
    function survey(cam) { // 总览巡视：仅手机端、未开启减弱动画时
      if (surveyAnim) { surveyAnim.cancel(); surveyAnim = null; }
      if (!cam || !cam.pan || reduced() || !world.animate) return;
      const s = cam.k / geo.k0, t = x => `translate(${x.toFixed(2)}px,${cam.ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
      surveyAnim = world.animate([{ transform: t(cam.tx) }, { transform: t(cam.tx - cam.pan) }], { duration: 9000, delay: 1100, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    }
    function apply(cam, animate) {
      const s = cam.k / geo.k0;
      survey(cam.pan && zoomMul === 1 ? cam : null);
      cv.classList.toggle('is-anim', !!animate && !reduced());
      world.style.transform = `translate(${cam.tx.toFixed(2)}px,${cam.ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
      world.style.setProperty('--inv', (1 / s).toFixed(5));
      cv.classList.toggle('is-tiny', N.base.w * cam.k < 84);
      if (zoomVal) zoomVal.textContent = Math.round(cam.k * 100) + '%';
    }

    /* 面板：显示所选节点的真实要求（提示词 / 技能参数 / 参考图） */
    function nodePanel(key) {
      const n = N[key], f = doc.createDocumentFragment();
      const h = el('div', 'pn-h'); h.append(el('span', 'pn-op', n.op), el('strong', '', n.name)); f.append(h);
      if (n.parent) { const p = N[n.parent], r = el('div', 'pn-ref'), im = new Image(); im.src = `v7/assets/img/${p.img}.webp`; im.alt = ''; const t = el('span', '', '参考图'); t.append(el('b', '', p.name)); r.append(im, t); f.append(r); }
      if (n.skill) { const s = el('div', 'pn-skill'); s.append(el('span', '', n.skill), el('span', '', n.param)); f.append(s); }
      f.append(el('p', 'pn-text', n.prompt));
      const m = el('div', 'pn-meta'); (n.meta || []).forEach(t => m.append(el('span', '', t)));
      if (n.badge) m.append(el('span', '', n.badge));
      f.append(m);
      return f;
    }
    function listPanel(spec) {
      const f = doc.createDocumentFragment(), h = el('div', 'pn-h');
      h.append(el('strong', '', spec.title), el('span', '', spec.rows.length + ' 张')); f.append(h);
      const ul = el('ul', 'pn-rows');
      spec.rows.forEach(key => {
        const n = N[key], li = el('li'), b = el('button'), im = new Image(), t = el('span');
        b.type = 'button'; b.dataset.inspect = key; im.src = `v7/assets/img/${n.img}.webp`; im.alt = '';
        t.append(el('b', '', n.skill ? `${n.skill} · ${n.param.replace(/^目标(时间|季节)\s*/, '')}` : `${n.op} · ${n.name}`), el('i', '', n.skill ? '技能' : n.prompt));
        b.append(im, t); b.setAttribute('aria-label', `查看「${n.name}」的要求`); li.append(b); ul.append(li);
      });
      f.append(ul); return f;
    }
    function setPanel(spec) {
      if (!spec) { panel.hidden = true; panel.replaceChildren(); return false; }
      panel.replaceChildren(spec.node ? nodePanel(spec.node) : listPanel(spec));
      panel.hidden = false; panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
      panel.setAttribute('aria-label', spec.node ? `「${N[spec.node].name}」的要求` : spec.title);
      return true;
    }

    function render(animate) {
      if (!geo && !measure()) return;
      const st = S[state];
      let focus, active, edges, spec;
      if (inspect) { const n = N[inspect]; focus = (geo.mobile || !n.parent) ? [inspect] : [n.parent, inspect]; active = n.parent ? [inspect, n.parent] : [inspect]; edges = n.parent ? [`${n.parent}-${inspect}`] : []; spec = { node: inspect }; }
      else { focus = geo.mobile ? st.focusM : st.focusD; if (focus === 'all' && state === 0 && !geo.mobile) focus = 'wide'; active = st.active; edges = st.edges; spec = st.panel && st.panel.mobileOnly && !geo.mobile ? null : st.panel; }
      const shown = setPanel(spec);
      Object.keys(nodeEls).forEach(k => nodeEls[k].classList.toggle('is-active', active.indexOf(k) > -1));
      Object.keys(edgeEls).forEach(k => edgeEls[k].classList.toggle('is-on', edges === 'all' || edges.indexOf(k) > -1));
      cv.classList.toggle('has-focus', active.length > 0);
      if (active.length && !settled) settle();
      const held = doc.activeElement && world.contains(doc.activeElement) ? doc.activeElement.closest('.nd') : null;
      setTabStop(held ? held.dataset.node : inspect || (Array.isArray(focus) ? focus[0] : order[0].dataset.node));
      apply(camera(focus, shown), animate);
      steps.forEach((s, i) => s.classList.toggle('is-on', i === state));
      dots.forEach((d, i) => { d.classList.toggle('is-on', i === state); if (i === state) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
      if (prev) prev.disabled = state === 0; if (next) next.disabled = state === S.length - 1;
    }
    function settle() { settled = true; cv.classList.add('is-settled'); }
    function setState(i, animate) { i = clamp(i, 0, S.length - 1); if (i === state && !inspect && zoomMul === 1) return; state = i; inspect = null; zoomMul = 1; render(animate); }

    /* 滚动联动 */
    const stickY = () => story.getBoundingClientRect().top + window.scrollY - headerH();
    const travel = () => Math.max(1, story.clientHeight - (parseFloat(getComputedStyle(story).paddingBottom) || 0) - pin.offsetHeight);
    const onScroll = raf(() => {
      if (!live) return;
      const y = window.scrollY - stickY(), p = clamp(y / travel(), 0, 1);
      let i = 0; for (let j = 0; j < THR.length; j++) if (p >= THR[j]) i = j;
      if (i !== state) setState(i, true);
      const t = clamp(-y / Math.max(stickY(), 1), 0, 1);
      app.style.transform = t > 0.002 ? `perspective(2400px) rotateX(${(t * 4).toFixed(2)}deg) scale(${(1 - t * 0.014).toFixed(4)})` : '';
    });
    function goto(i) {
      i = clamp(i, 0, S.length - 1);
      if (!live) { setState(i, false); return; }
      const a = THR[i], b = i + 1 < THR.length ? THR[i + 1] : 1, top = i === 0 ? stickY() : stickY() + (a + (b - a) * 0.4) * travel() + 2;
      window.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' });
    }
    const mqShort = window.matchMedia('(max-height: 519px)'); // 横屏手机等很矮的视口放不下吸顶画布，改用点选模式
    function setMode() {
      live = !reduced() && !mqShort.matches;
      story.classList.toggle('is-live', live); story.classList.toggle('is-static', !live);
      steps.forEach((s, i) => { if (live) { s.removeAttribute('tabindex'); s.removeAttribute('role'); } else { s.tabIndex = 0; s.setAttribute('role', 'button'); } });
      if (!live) { app.style.transform = ''; settle(); }
      geo = null; requestAnimationFrame(() => { if (measure()) { render(false); onScroll(); } });
    }

    cv.classList.add('is-js');
    world.setAttribute('aria-label', `画布节点，共 ${order.length} 个。方向键在节点间移动，回车查看这张图的要求，Esc 返回。`);
    world.addEventListener('click', e => { const n = e.target.closest('.nd'); if (!n) return; const k = n.dataset.node; inspect = inspect === k ? null : k; zoomMul = 1; if (!settled) settle(); render(true); });
    panel.addEventListener('click', e => { const b = e.target.closest('[data-inspect]'); if (!b) return; inspect = b.dataset.inspect; zoomMul = 1; render(true); const n = nodeEls[inspect]; if (n) n.focus({ preventScroll: true }); });
    $$('[data-zoom]', story).forEach(b => b.addEventListener('click', () => { const d = b.dataset.zoom; if (d === 'fit') { zoomMul = 1; inspect = null; } else zoomMul = clamp(zoomMul * (d === 'in' ? 1.25 : 0.8), 0.5, 3); render(true); }));
    dots.forEach(d => d.addEventListener('click', () => goto(+d.dataset.goto)));
    if (prev) prev.addEventListener('click', () => goto(state - 1));
    if (next) next.addEventListener('click', () => goto(state + 1));
    steps.forEach((s, i) => {
      s.addEventListener('click', () => { if (!live) setState(i, false); });
      s.addEventListener('keydown', e => { if (!live && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setState(i, false); } });
    });
    /* 键盘聚焦到镜头外的节点时，镜头跟过去，避免焦点落在看不见的地方 */
    world.addEventListener('focusin', e => {
      const n = e.target.closest('.nd'); if (!n || !n.matches(':focus-visible') || inspect === n.dataset.node) return;
      const r = n.getBoundingClientRect(), c = cv.getBoundingClientRect();
      if (r.left >= c.left && r.right <= c.right && r.top >= c.top && r.bottom <= c.bottom) return;
      inspect = n.dataset.node; zoomMul = 1; if (!settled) settle(); render(true);
    });
    world.addEventListener('keydown', e => {
      const n = e.target.closest('.nd'); if (!n) return;
      const i = order.indexOf(n), k = e.key; let j = i;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = i + 1; else if (k === 'ArrowLeft' || k === 'ArrowUp') j = i - 1; else if (k === 'Home') j = 0; else if (k === 'End') j = order.length - 1; else return;
      e.preventDefault(); j = clamp(j, 0, order.length - 1); if (j === i) return;
      setTabStop(order[j].dataset.node); order[j].focus({ preventScroll: true });
    });
    cv.addEventListener('keydown', e => { if (e.key === 'Escape' && (inspect || zoomMul !== 1)) { inspect = null; zoomMul = 1; render(true); } });
    window.addEventListener('scroll', onScroll, { passive: true });
    const onResize = raf(() => { if (measure()) { render(false); onScroll(); } });
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(cv); else window.addEventListener('resize', onResize);
    mqReduce.addEventListener('change', setMode); mqShort.addEventListener('change', setMode);
    setTimeout(() => { if (!settled) settle(); }, 2600);
    setMode();
  })();

  /* ---------------- 视频：地标项目的三段镜头 + 手绘短片 ---------------- */
  (function media() {
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const ensure = v => { if (!v.getAttribute('src') && v.dataset.src) { v.preload = 'auto'; v.src = v.dataset.src; } };
    const players = [];
    function make(wrap, btn, opts) {
      const v = $('video', wrap); if (!v || !btn) return null;
      const title = btn.getAttribute('aria-label').replace(/^播放：/, '');
      const p = { wrap, v, userPaused: false, failed: false, hoverAt: 0 };
      v.removeAttribute('controls'); // 脚本可用时改用页面自己的控件；不可用时保留浏览器自带控件
      const sync = () => { const on = !v.paused && !v.ended; wrap.classList.toggle('is-playing', on); btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', (on ? '暂停：' : '播放：') + title); };
      p.play = () => { if (p.failed) return; ensure(v); if (opts.exclusive) players.forEach(o => { if (o !== p && o.group === opts.group) o.v.pause(); }); const r = v.play(); if (r && r.catch) r.catch(() => sync()); };
      p.pause = () => v.pause();
      p.group = opts.group;
      btn.addEventListener('click', () => {
        if (v.paused) { p.userPaused = false; p.play(); }
        else if (p.hoverAt && performance.now() - p.hoverAt < 900) { p.hoverAt = 0; p.userPaused = false; } // 悬停刚让它播起来，紧接着的点击是“想播放”，不反向暂停
        else { p.userPaused = true; p.pause(); }
      });
      ['play', 'playing', 'pause', 'ended'].forEach(ev => v.addEventListener(ev, sync));
      v.addEventListener('error', () => { p.failed = true; wrap.classList.add('is-error'); const m = $('.clip-error', wrap); if (m) m.hidden = false; btn.disabled = true; sync(); });
      players.push(p); return p;
    }

    /* 三段镜头 */
    const reel = $('[data-reel]');
    const clips = $$('[data-clip]').map(c => {
      const p = make(c, $('.clip-toggle', c), { exclusive: true, group: 'reel' }); if (!p) return null;
      const seek = $('.clip-seek', c), time = $('.clip-time', c), fs = $('.clip-fs', c), v = p.v;
      const total = () => (isFinite(v.duration) && v.duration) || 0;
      const paint = () => { const d = total(), r = d ? v.currentTime / d : 0; if (seek && doc.activeElement !== seek) seek.value = Math.round(r * 1000); if (seek) { seek.style.setProperty('--p', (r * 100).toFixed(2) + '%'); seek.setAttribute('aria-valuetext', `${fmt(v.currentTime)}，共 ${fmt(d)}`); } if (time && d) time.textContent = `${fmt(v.currentTime)} / ${fmt(d)}`; };
      let tick = 0; const loop = () => { paint(); tick = v.paused ? 0 : requestAnimationFrame(loop); };
      v.addEventListener('play', () => { if (!tick) tick = requestAnimationFrame(loop); });
      ['timeupdate', 'loadedmetadata', 'seeked'].forEach(ev => v.addEventListener(ev, paint));
      if (seek) seek.addEventListener('input', () => { ensure(v); const set = () => { const d = total(); if (d) v.currentTime = seek.value / 1000 * d; seek.style.setProperty('--p', (seek.value / 10) + '%'); }; if (total()) set(); else v.addEventListener('loadedmetadata', set, { once: true }); });
      if (fs) fs.addEventListener('click', () => { ensure(v); const req = v.requestFullscreen || v.webkitRequestFullscreen || v.webkitEnterFullscreen; if (req) { try { const r = req.call(v); if (r && r.catch) r.catch(() => {}); } catch (e) { /* 不支持全屏时保持原位播放 */ } } });
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) c.addEventListener('mouseenter', () => { if (!reduced() && !p.userPaused && !p.failed && v.paused) { p.hoverAt = performance.now(); p.play(); } });
      return p;
    }).filter(Boolean);
    if (reel && clips.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { if (reduced()) return; if (clips.some(c => !c.v.paused) || clips.some(c => c.userPaused)) return; const first = clips.find(c => c.wrap.hasAttribute('data-autoplay')) || clips[0]; first.play(); }
        else clips.forEach(c => c.pause());
      }), { threshold: 0.35 });
      io.observe(reel);
    }

    /* 手绘短片：可见时循环播放 */
    const loops = $$('[data-loop]').map(l => make(l, $('.loop-btn', l), { exclusive: false, group: 'loop' })).filter(Boolean);
    if (loops.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { const p = loops.find(l => l.wrap === e.target); if (!p) return; if (e.isIntersecting) { if (!reduced() && !p.userPaused) p.play(); } else p.pause(); }), { threshold: 0.5 });
      loops.forEach(l => io.observe(l.wrap));
    }
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) players.forEach(p => p.pause()); });
  })();

  /* ---------------- 表达：桌面为标签页，手机为纵向排列 ---------------- */
  (function tabs() {
    const box = $('[data-tabs]'); if (!box) return;
    const list = $('[role="tablist"]', box), tabs = $$('[role="tab"]', box), panels = tabs.map(t => doc.getElementById(t.getAttribute('aria-controls')));
    const mq = window.matchMedia('(min-width: 900px)');
    const DUR = 9000; let current = 0, timer = 0, auto = false, inView = false, held = false, enabled = false;
    box.style.setProperty('--tab-dur', DUR + 'ms');
    function select(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((t, j) => { const on = j === current; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (enabled) panels[j].hidden = !on; });
      if (focus) tabs[current].focus();
      $$('video', box).forEach(v => { if (v.closest('[hidden]')) v.pause(); });
      restart();
    }
    function restart() { clearTimeout(timer); const run = auto && enabled && inView && !held && !reduced(); box.classList.toggle('is-auto', auto && enabled && !reduced()); box.classList.toggle('is-paused', !run); if (!run) return; const t = tabs[current], bar = $('.tab-bar', t); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; } timer = setTimeout(() => select(current + 1, false), DUR); }
    function stopAuto() { auto = false; restart(); }
    function setEnabled() {
      enabled = mq.matches; box.classList.toggle('is-tabs', enabled);
      panels.forEach((p, j) => { p.hidden = enabled ? j !== current : false; if (enabled) p.setAttribute('tabindex', '0'); else p.removeAttribute('tabindex'); });
      restart();
    }
    tabs.forEach((t, i) => t.addEventListener('click', () => { stopAuto(); select(i, false); }));
    list.addEventListener('keydown', e => {
      const k = e.key; let i = current;
      if (k === 'ArrowDown' || k === 'ArrowRight') i++; else if (k === 'ArrowUp' || k === 'ArrowLeft') i--; else if (k === 'Home') i = 0; else if (k === 'End') i = tabs.length - 1; else return;
      e.preventDefault(); stopAuto(); select(i, true);
    });
    const hold = v => { held = v; restart(); };
    box.addEventListener('mouseenter', () => hold(true)); box.addEventListener('mouseleave', () => hold(false));
    box.addEventListener('focusin', () => hold(true)); box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) hold(false); });
    box.addEventListener('pointerdown', e => { if (!e.target.closest('[role="tab"]')) stopAuto(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; restart(); }, { threshold: 0.4 }).observe(box);
    mq.addEventListener('change', setEnabled); mqReduce.addEventListener('change', restart);
    auto = true; setEnabled();
  })();

  /* ---------------- 对比预览（同一参考图的不同结果） ---------------- */
  (function compare() {
    $$('[data-compare]').forEach(box => {
      const frame = $('.cmp-frame', box), range = $('[data-cmp-range]', box), b = $('[data-cmp-b]', box), tag = $('[data-cmp-tag]', box);
      const stage = box.closest('.stage') || box.parentNode, vars = $$('[data-cmp-var]', stage);
      const set = () => { frame.style.setProperty('--pos', range.value + '%'); range.setAttribute('aria-valuetext', `图 A 显示 ${range.value}%`); };
      range.addEventListener('input', set); set();
      function pick(i, focus) {
        vars.forEach((v, j) => { const on = j === i; v.setAttribute('aria-checked', String(on)); v.tabIndex = on ? 0 : -1; });
        const v = vars[i]; b.src = `v7/assets/img/${v.dataset.cmpVar}.webp`; b.alt = '图 B：' + v.dataset.label; tag.textContent = '图 B · ' + v.dataset.label; if (focus) v.focus();
      }
      vars.forEach((v, i) => {
        v.addEventListener('click', () => pick(i, false));
        v.addEventListener('keydown', e => { let j = i; if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % vars.length; else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + vars.length) % vars.length; else return; e.preventDefault(); pick(j, true); });
      });
    });
  })();

  /* ---------------- 图纸切换 ---------------- */
  (function gallery() {
    $$('[data-gallery]').forEach(box => {
      const main = $('[data-gallery-main]', box), items = $$('[data-gallery-item]', box);
      function pick(i, focus) { items.forEach((b, j) => { const on = j === i; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }); const b = items[i]; main.src = `v7/assets/img/${b.dataset.galleryItem}.webp`; main.alt = b.dataset.alt; if (focus) b.focus(); }
      items.forEach((b, i) => {
        b.setAttribute('aria-label', b.dataset.alt);
        b.addEventListener('click', () => pick(i, false));
        b.addEventListener('keydown', e => { let j = i; if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % items.length; else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + items.length) % items.length; else return; e.preventDefault(); pick(j, true); });
      });
    });
  })();

  /* ---------------- 一起推敲：提问卡片与偏好（界面示意） ---------------- */
  (function together() {
    const q = $('[data-qcard]');
    if (q) {
      const status = $('[data-q-status]', q);
      $('[data-q-submit]', q).addEventListener('click', () => { status.textContent = '已提交，可修改后重新提交'; });
      $('[data-q-skip]', q).addEventListener('click', () => { $$('input', q).forEach(i => { i.checked = false; }); status.textContent = '已跳过'; });
      q.addEventListener('change', () => { status.textContent = ''; });
    }
    const fb = $('[data-feedback]'), list = $('[data-mem-list]');
    if (fb && list) {
      const status = $('[data-fb-status]', fb), buttons = $$('[data-fb]', fb), hint = $('[data-mem-hint]', list), img = $('img', fb);
      let row = null;
      buttons.forEach(b => b.addEventListener('click', () => {
        const kind = b.dataset.fb, was = b.getAttribute('aria-pressed') === 'true';
        buttons.forEach(o => o.setAttribute('aria-pressed', 'false'));
        if (row) { row.remove(); row = null; }
        if (was) { status.textContent = ''; if (hint) hint.hidden = false; return; }
        b.setAttribute('aria-pressed', 'true');
        status.textContent = kind === 'like' ? '已记住这个风格' : '已记下，下次避免';
        row = el('li', 'mem');
        const text = el('span', 'mem-text'), thumb = new Image(); thumb.src = img.getAttribute('src'); thumb.alt = ''; text.append(thumb, doc.createTextNode('这次结果的风格'));
        const sw = el('button', 'switch'); sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', 'true'); sw.setAttribute('aria-label', '用于生成：这次结果的风格'); sw.append(el('i'));
        row.append(el('span', 'mem-kind ' + (kind === 'like' ? 'like' : 'avoid'), kind === 'like' ? '喜欢' : '避免'), text, el('span', 'mem-src', kind === 'like' ? '来自点赞反馈' : '来自点踩反馈'), sw, el('span', 'mem-off', '此条已关闭，不会影响生成结果'));
        list.insertBefore(row, hint || null); if (hint) hint.hidden = true;
      }));
      list.addEventListener('click', e => { const sw = e.target.closest('.switch'); if (!sw) return; const on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', String(on)); sw.closest('.mem').classList.toggle('is-off', !on); });
    }
  })();

  /* ---------------- 输入框（界面示意）：填入示例语句、复制 ---------------- */
  (function composer() {
    const box = $('[data-composer]'); if (!box) return;
    const ta = $('[data-composer-text]', box), status = $('[data-composer-status]', box), copy = $('[data-composer-copy]', box), sug = $$('[data-suggest] button');
    let typing = 0;
    function type(text) {
      clearInterval(typing); status.textContent = '';
      if (reduced()) { ta.value = text; return; }
      let i = 0; ta.value = '';
      typing = setInterval(() => { i += 2; ta.value = text.slice(0, i); if (i >= text.length) clearInterval(typing); }, 16);
    }
    sug.forEach(b => { b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => { sug.forEach(o => o.setAttribute('aria-pressed', String(o === b))); type(b.dataset.text); }); });
    ta.addEventListener('input', () => { clearInterval(typing); status.textContent = ''; sug.forEach(o => o.setAttribute('aria-pressed', 'false')); });
    copy.addEventListener('click', () => {
      clearInterval(typing);
      const pressed = sug.find(o => o.getAttribute('aria-pressed') === 'true'); if (pressed) ta.value = pressed.dataset.text;
      const text = ta.value.trim();
      if (!text) { status.textContent = '先写一句，或点下面的任务'; ta.focus(); return; }
      const ok = () => { status.textContent = '已复制到剪贴板'; }, fail = () => { ta.focus(); ta.select(); let done = false; try { done = doc.execCommand('copy'); } catch (e) { done = false; } status.textContent = done ? '已复制到剪贴板' : '未能自动复制，已选中文字，可手动复制'; };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fail); else fail();
    });
  })();

  /* ---------------- 与 D5：关联项目（界面示意） ---------------- */
  (function d5() {
    const box = $('[data-d5]'); if (!box) return;
    const card = $('.link-card', box), sub = $('[data-link-sub]', box), empty = $('[data-res-empty]', box), linked = $('[data-res-linked]', box), status = $('[data-res-status]', box), ok = $('[data-link="ok"]', box), ignore = $('[data-link="ignore"]', box), cap = $('[data-capture]', box);
    const initial = sub.textContent;
    function set(on) { card.classList.toggle('is-linked', on); sub.textContent = on ? '关联中' : initial; ok.hidden = on; ignore.textContent = on ? '断开' : '忽略'; empty.hidden = on; linked.hidden = !on; status.textContent = ''; }
    ok.addEventListener('click', () => { set(true); ignore.focus(); });
    ignore.addEventListener('click', () => { const was = card.classList.contains('is-linked'); set(false); if (was) ok.focus(); });
    cap.addEventListener('click', () => { status.textContent = '当前视口已添加到画布'; });
  })();

  /* ---------------- 下载入口：填入正式链接后生效；未填时如实说明 ---------------- */
  (function download() {
    const box = $('[data-download]'), status = $('[data-download-status]'); if (!box || !status) return;
    $$('button', box).forEach(b => b.addEventListener('click', () => {
      const href = b.dataset.href; if (href) { window.location.href = href; return; }
      status.textContent = `${b.dataset.platform === 'windows' ? 'Windows' : 'macOS'} 版下载入口尚未接入。这是本地预览版本，不提供安装包。`;
      status.classList.remove('is-pulse'); void status.offsetWidth; status.classList.add('is-pulse');
    }));
  })();
})();
