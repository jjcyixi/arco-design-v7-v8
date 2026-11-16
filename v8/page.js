/* D5 Arco 产品首页 · V8（演示版本）
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
  const el = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const raf = fn => { let t = 0; return (...a) => { if (t) return; t = requestAnimationFrame(() => { t = 0; fn(...a); }); }; };
  const headerH = () => parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 64;
  let DATA = {}; try { DATA = JSON.parse($('#v8-data').textContent); } catch (e) { DATA = {}; }

  /* 一组单选按钮：方向键移动并选中 */
  function radios(buttons, onPick) {
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => onPick(i, false));
      b.addEventListener('keydown', e => {
        let j = i;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % buttons.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + buttons.length) % buttons.length;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = buttons.length - 1; else return;
        e.preventDefault(); onPick(j, true);
      });
    });
    return i => buttons.forEach((b, j) => { b.setAttribute('aria-checked', String(j === i)); b.tabIndex = (i < 0 ? j === 0 : j === i) ? 0 : -1; });
  }

  /* ---------------- 顶栏、色调、移动菜单 ---------------- */
  (function header() {
    const header = $('[data-header]'), toggle = $('[data-menu-toggle]'), menu = $('[data-menu]');
    if (!header) return;
    const tones = $$('[data-tone]'), theme = $('meta[name="theme-color"]');
    const toneAt = y => { let t = 'light'; tones.forEach(n => { const r = n.getBoundingClientRect(); if (r.top <= y && r.bottom > y) t = n.dataset.tone; }); return t; };
    const links = $$('.site-nav a');
    const spots = [['place', '#place'], ['task', '#task'], ['task-decide', '#task'], ['task-angles', '#task'], ['loop', '#loop'], ['express', '#task'], ['start', '#start']].map(([id, href]) => [doc.getElementById(id), href]).filter(s => s[0]);
    const onScroll = raf(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      const head = toneAt(headerH() / 2), dock = toneAt(window.innerHeight - 44);
      if (root.dataset.headTone !== head) { root.dataset.headTone = head; if (theme) theme.setAttribute('content', head === 'dark' ? '#0c0c10' : '#fbfaf8'); }
      if (root.dataset.dockTone !== dock) root.dataset.dockTone = dock;
      let cur = ''; spots.forEach(([n, href]) => { if (n.getBoundingClientRect().top <= window.innerHeight * 0.4) cur = href; });
      links.forEach(a => { if (a.getAttribute('href') === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    });
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); onScroll();

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
      window.dispatchEvent(new Event('arco:menu'));
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
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(n => io.observe(n));
  })();

  /* ---------------- 首屏：产品动态演示（五个片段） ---------------- */
  (function film() {
    const stage = $('[data-film-stage]'); if (!stage) return;
    const chapters = $$('[data-film-go]', stage), items = chapters.map(b => b.closest('li')), bars = chapters.map(b => $('.film-bar', b));
    const toggle = $('[data-film-toggle]', stage), caption = $('[data-film-caption]', stage), tag = $('[data-film-tag]', stage), video = $('[data-film-video]', stage);
    const F = DATA.film || { captions: [], tags: [], dur: [] }, N = chapters.length;
    let cur = -1, cover = false, elapsed = 0, last = 0, userPaused = false, inView = true, tickId = 0;
    const running = () => !userPaused && inView && !doc.hidden && !reduced();
    function syncVideo() { if (!video) return; if (cur === 2 && !cover && running()) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } else video.pause(); }
    function show(i, restart) {
      i = (i + N) % N;
      if (restart || i === cur) { stage.dataset.scene = ''; void stage.offsetWidth; }
      cover = false; cur = i; elapsed = 0; stage.dataset.scene = String(i);
      items.forEach((li, j) => {
        li.classList.toggle('is-on', j === i); li.classList.toggle('is-done', j < i);
        bars[j].style.setProperty('--p', j === i && reduced() ? '1' : '0');
        if (j === i) chapters[j].setAttribute('aria-current', 'true'); else chapters[j].removeAttribute('aria-current');
      });
      if (caption && F.captions[i]) caption.textContent = F.captions[i];
      if (tag && F.tags[i]) tag.textContent = F.tags[i];
      if (video && i === 2) { try { video.currentTime = 0; } catch (e) { /* 尚未加载时忽略 */ } }
      syncVideo();
    }
    // 片头：载入时先放这件任务最后做出来的几张图，随后回到第一句话。只出现一次，不占章节
    function showCover() {
      cover = true; elapsed = 0; stage.dataset.scene = 'cover';
      items.forEach((li, j) => { li.classList.remove('is-on', 'is-done'); bars[j].style.setProperty('--p', '0'); chapters[j].removeAttribute('aria-current'); });
      if (caption && F.cover) caption.textContent = F.cover;
      if (tag && F.coverTag) tag.textContent = F.coverTag;
      syncVideo();
    }
    function tick(now) {
      tickId = 0; if (!running()) return;
      elapsed += Math.min(120, now - last); last = now;
      if (cover) { if (elapsed >= (F.coverDur || 2600)) show(0, false); }
      else {
        const d = F.dur[cur] || 7000;
        bars[cur].style.setProperty('--p', Math.min(1, elapsed / d).toFixed(4));
        if (elapsed >= d) show(cur + 1, false);
      }
      tickId = requestAnimationFrame(tick);
    }
    function sync() {
      const on = running();
      stage.classList.toggle('is-paused', !on && !reduced());
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.setAttribute('aria-label', userPaused ? '继续播放演示' : '暂停演示');
      syncVideo();
      if (on && !tickId) { last = performance.now(); tickId = requestAnimationFrame(tick); }
    }
    function setup() {
      const r = reduced();
      stage.classList.toggle('is-static', r); toggle.hidden = r;
      if (r) show(cur < 0 ? 2 : cur, false); // 减弱动态效果：不放片头，直接给一幅完整的静态画面
      else if (cur < 0) { if (!cover) showCover(); }
      else show(cur, false);
      sync();
    }
    chapters.forEach((b, i) => b.addEventListener('click', () => { show(i, true); sync(); }));
    toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; sync(); }, { threshold: 0.2 }).observe(stage);
    doc.addEventListener('visibilitychange', sync);
    mqReduce.addEventListener('change', setup);
    setup();
  })();

  /* ---------------- 常驻的对话入口 ---------------- */
  (function dock() {
    const dock = $('[data-dock]'); if (!dock) return;
    const pill = $('[data-dock-toggle]', dock), panel = $('[data-dock-panel]', dock), line = $('[data-dock-line]', dock), form = $('[data-dock-form]', dock), input = $('[data-dock-input]', dock), close = $('[data-dock-close]', dock);
    const rail = $$('[data-dock-stage]', dock), stages = $$('main [data-stage]'), place = $('#place'), start = $('#start');
    const L = DATA.dock || {};
    let stage = '', open = false;
    dock.hidden = false; dock.classList.add('is-away'); dock.setAttribute('inert', '');
    function setOpen(v, focus) {
      open = v; panel.hidden = !v; pill.setAttribute('aria-expanded', String(v));
      if (v && focus) input.focus({ preventScroll: true }); else if (!v && focus) pill.focus({ preventScroll: true });
    }
    const update = raf(() => {
      const vh = window.innerHeight;
      // 首屏不出现（那里有演示）；到了收尾的任务入口也让开（那里有真正的输入框）
      const away = !place || place.getBoundingClientRect().top > vh * 0.82 || (start && start.getBoundingClientRect().top < vh * 0.55) || root.classList.contains('menu-open');
      if (away && open) setOpen(false, false);
      dock.classList.toggle('is-away', away);
      if (away) dock.setAttribute('inert', ''); else dock.removeAttribute('inert');
      let s = 'place'; stages.forEach(n => { if (n.getBoundingClientRect().top < vh * 0.62) s = n.dataset.stage; });
      if (s !== stage) {
        stage = s;
        if (L[s]) { line.textContent = L[s]; line.classList.remove('is-swap'); void line.offsetWidth; line.classList.add('is-swap'); }
        rail.forEach(a => { if (a.dataset.dockStage === s) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
      }
    });
    pill.addEventListener('click', () => setOpen(!open, true));
    close.addEventListener('click', () => setOpen(false, true));
    dock.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false, true); } });
    doc.addEventListener('pointerdown', e => { if (open && !dock.contains(e.target)) setOpen(false, false); });
    rail.forEach(a => a.addEventListener('click', () => setOpen(false, false)));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim(); input.value = ''; setOpen(false, false);
      if (text) window.dispatchEvent(new CustomEvent('arco:carry', { detail: text }));
      const target = doc.getElementById('start'), ta = $('[data-composer-text]');
      if (target) target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      if (ta) ta.focus({ preventScroll: true });
    });
    window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); window.addEventListener('arco:menu', update);
    update();
  })();

  /* ---------------- 描述原文：展开 / 收起 ---------------- */
  (function quotes() {
    $$('[data-quote]').forEach((q, i) => {
      const p = $('p', q); if (!p) return;
      p.id = p.id || 'quote-' + i;
      const b = el('button', 'quote-more', '展开全文'); b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', p.id);
      b.addEventListener('click', () => { const on = !q.classList.contains('is-open'); q.classList.toggle('is-open', on); b.setAttribute('aria-expanded', String(on)); b.textContent = on ? '收起' : '展开全文'; });
      q.append(b);
    });
  })();

  /* ---------------- 八个视角 ---------------- */
  (function viewer() {
    const box = $('[data-viewer]'), A = DATA.angles || []; if (!box || !A.length) return;
    const img = $('[data-viewer-img]', box), name = $('[data-viewer-name]', box), prompt = $('[data-viewer-prompt]', box), buttons = $$('[data-angle]', box), map = $$('.mm-n');
    const mark = radios(buttons, (i, focus) => {
      const a = A[i]; mark(i);
      img.src = `v8/assets/img/landmark-${a.n}.webp`; img.alt = a.alt; name.textContent = a.name; prompt.textContent = a.prompt;
      map.forEach(n => n.classList.toggle('is-on', n.dataset.n === a.n && n.classList.contains('mm-a')));
      if (focus) buttons[i].focus();
    });
    map.forEach(n => n.classList.toggle('is-on', n.dataset.n === A[0].n && n.classList.contains('mm-a')));
  })();

  /* ---------------- Arco → D5 Render → Arco（联动示意） ---------------- */
  (function roundTrip() {
    const rt = $('[data-rt]'), C = DATA.rt || []; if (!rt) return;
    const tabs = $$('[data-rt-go]', rt), panel = $('#rt-stage'), cap = $('[data-rt-caption]', rt);
    let step = 0, timer = 0, played = false;
    const stop = () => { clearTimeout(timer); timer = 0; };
    function go(i, focus) {
      step = (i + tabs.length) % tabs.length;
      rt.dataset.step = ''; void rt.offsetWidth; rt.dataset.step = String(step);
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === step)); t.tabIndex = j === step ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'rt-tab-' + step);
      if (C[step]) cap.textContent = C[step];
      if (focus) tabs[step].focus();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { stop(); go(i, false); });
      t.addEventListener('keydown', e => {
        let j = step;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = step + 1; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = step - 1; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = tabs.length - 1; else return;
        e.preventDefault(); stop(); go(j, true);
      });
    });
    rt.addEventListener('focusin', stop); rt.addEventListener('pointerdown', stop);
    // 第一次滚到这里时，自己走一遍；之后由人来点
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting || played || reduced()) return;
        played = true; io.disconnect();
        timer = setTimeout(() => { go(1, false); timer = setTimeout(() => go(2, false), 4800); }, 2400);
      }, { threshold: 0.55 });
      io.observe(rt);
    }
  })();

  /* ---------------- 三段镜头：从哪张图起 ---------------- */
  (function player() {
    const pl = $('[data-player]'), C = DATA.clips || []; if (!pl || !C.length) return;
    const vids = $$('[data-clip-video]', pl), picks = $$('[data-clip]'), toggle = $('[data-player-toggle]', pl), seek = $('[data-player-seek]', pl), time = $('[data-player-time]', pl), fs = $('[data-player-fs]', pl);
    const title = $('[data-player-title]', pl), secs = $('[data-player-secs]', pl), fromImg = $('[data-player-from-img]', pl), from = $('[data-player-from]', pl), prompt = $('[data-player-prompt]', pl), remark = $('[data-player-remark]', pl), err = $('[data-player-error]', pl), echo = $('[data-clip-echo]');
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const failed = vids.map(() => false);
    let cur = 0, userPaused = false, tickId = 0, inView = false;
    vids.forEach(v => v.removeAttribute('controls')); // 脚本可用时改用页面自己的控件；不可用时保留浏览器自带控件
    const v = () => vids[cur];
    const dur = () => (isFinite(v().duration) && v().duration) || 0;
    function syncUI() {
      const on = !v().paused && !v().ended && !failed[cur];
      pl.classList.toggle('is-playing', on); toggle.setAttribute('aria-pressed', String(on)); toggle.setAttribute('aria-label', (on ? '暂停：' : '播放：') + C[cur].title);
    }
    function paint() {
      const d = dur(), total = d || C[cur].secs, r = d ? v().currentTime / d : 0;
      if (doc.activeElement !== seek) seek.value = Math.round(r * 1000);
      seek.style.setProperty('--p', (r * 100).toFixed(2) + '%'); seek.setAttribute('aria-valuetext', `${fmt(v().currentTime)}，共 ${fmt(total)}`);
      time.textContent = `${fmt(v().currentTime)} / ${fmt(total)}`;
    }
    const loop = () => { paint(); tickId = v().paused ? 0 : requestAnimationFrame(loop); };
    function play() { if (failed[cur]) return; const p = v().play(); if (p && p.catch) p.catch(() => syncUI()); }
    function showError() { const f = failed[cur]; pl.classList.toggle('is-error', f); err.hidden = !f; toggle.disabled = f; }
    const mark = radios(picks, (i, focus) => {
      vids.forEach((x, j) => { if (j !== i) x.pause(); x.classList.toggle('is-on', j === i); });
      cur = i; mark(i);
      const c = C[i];
      title.textContent = c.title; secs.textContent = c.secs + ' 秒'; from.textContent = c.fromName; fromImg.src = `v8/assets/thumb/landmark-${c.from}.webp`; prompt.textContent = c.prompt;
      remark.hidden = !c.remark; remark.textContent = c.remark || ''; if (echo) echo.textContent = c.echo;
      seek.setAttribute('aria-label', c.title + '：播放进度'); fs.setAttribute('aria-label', '全屏播放：' + c.title);
      showError(); paint(); syncUI();
      if (!failed[i]) { userPaused = false; try { v().currentTime = 0; } catch (e) { /* 尚未加载时忽略 */ } play(); }
      if (focus) picks[i].focus();
    });
    vids.forEach((x, j) => {
      ['play', 'playing', 'pause', 'ended'].forEach(ev => x.addEventListener(ev, () => { if (j !== cur) return; syncUI(); if (!x.paused && !tickId) tickId = requestAnimationFrame(loop); }));
      ['timeupdate', 'loadedmetadata', 'seeked'].forEach(ev => x.addEventListener(ev, () => { if (j === cur) paint(); }));
      x.addEventListener('error', () => { failed[j] = true; if (j === cur) { showError(); syncUI(); } });
    });
    toggle.addEventListener('click', () => { if (v().paused) { userPaused = false; play(); } else { userPaused = true; v().pause(); } });
    seek.addEventListener('input', () => {
      const set = () => { const d = dur(); if (d) v().currentTime = seek.value / 1000 * d; seek.style.setProperty('--p', (seek.value / 10) + '%'); };
      if (dur()) set(); else { v().preload = 'auto'; v().addEventListener('loadedmetadata', set, { once: true }); v().load(); }
    });
    fs.addEventListener('click', () => { const x = v(), req = x.requestFullscreen || x.webkitRequestFullscreen || x.webkitEnterFullscreen; if (req) { try { const r = req.call(x); if (r && r.catch) r.catch(() => {}); } catch (e) { /* 不支持全屏时保持原位播放 */ } } });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; if (inView) { if (!reduced() && !userPaused) play(); } else vids.forEach(x => x.pause()); }, { threshold: 0.5 }).observe(pl);
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) vids.forEach(x => x.pause()); });
    seek.setAttribute('aria-label', C[0].title + '：播放进度'); fs.setAttribute('aria-label', '全屏播放：' + C[0].title);
    paint(); syncUI();
  })();

  /* ---------------- 收尾：从你手上的那件事开始 ---------------- */
  (function builder() {
    const box = $('[data-builder]'), T = DATA.tasks; if (!box || !T) return;
    const who = $$('[data-who]', box), haveBtns = $$('[data-have]', box), haveRender = $('[data-have-render]', box);
    const groups = { new: $('[data-tasks="new"]', box), render: $('[data-tasks="render"]', box) };
    const taskBtns = { new: $$('[data-task]', groups.new), render: $$('[data-task]', groups.render) };
    const ta = $('[data-composer-text]', box), status = $('[data-composer-status]', box), copy = $('[data-composer-copy]', box), haveLine = $('[data-composer-have]', box), haveList = $('[data-composer-have-list]', box);
    const said = $('[data-said]', box), saidN = $('[data-said-n]', box), saidList = $('[data-said-list]', box), hint = $('[data-b-hint]', box);
    const RENDER_ITEM = haveRender ? haveRender.dataset.have : '';
    const state = { who: 'new', task: -1, custom: false };
    const have = () => haveBtns.filter(b => !b.hidden && b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.have);
    function compose() {
      const h = have(), t = state.task > -1 ? T[state.who][state.task] : null;
      haveLine.hidden = !h.length; haveList.textContent = h.join('、');
      if (state.custom) { said.hidden = true; hint.hidden = false; hint.textContent = '这是你自己写的话，可以直接复制。'; return; }
      if (!t) { ta.value = ''; said.hidden = true; hint.hidden = false; hint.textContent = '先在左边选一件事，或者直接在上面写。'; return; }
      const extra = h.filter(x => x !== RENDER_ITEM); // 任务句里已经说了“我打开的 D5 Render 工程”，不重复
      const list = extra.join('、');
      ta.value = t.text.replace(/。$/, '') + '。' + (extra.length ? '手上有' + (/^[A-Za-z0-9]/.test(list) ? ' ' : '') + list + '。' : '');
      const parts = t.parts.concat(extra.length ? [['一并带上', extra.join('、')]] : []);
      saidList.replaceChildren(...parts.map(([k, val]) => { const li = el('li'); li.append(el('span', '', k), el('b', '', val)); return li; }));
      saidN.textContent = String(parts.length); said.hidden = false; hint.hidden = true; status.textContent = '';
    }
    const markTask = { new: null, render: null };
    ['new', 'render'].forEach(k => { markTask[k] = radios(taskBtns[k], (i, focus) => { state.task = i; state.custom = false; markTask[k](i); compose(); if (focus) taskBtns[k][i].focus(); }); });
    const markWho = radios(who, (i, focus) => {
      state.who = who[i].dataset.who; markWho(i);
      const r = state.who === 'render';
      if (haveRender) { haveRender.hidden = !r; haveRender.setAttribute('aria-pressed', String(r)); }
      groups.new.hidden = r; groups.render.hidden = !r;
      state.task = 0; state.custom = false; markTask[state.who](0); compose();
      if (focus) who[i].focus();
    });
    haveBtns.forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); compose(); }));
    const toCustom = () => { state.custom = true; state.task = -1; markTask[state.who](-1); compose(); };
    ta.addEventListener('input', () => { status.textContent = ''; toCustom(); });
    window.addEventListener('arco:carry', e => { ta.value = String(e.detail || ''); toCustom(); status.textContent = '已带上你刚才写的话。'; });
    copy.addEventListener('click', () => {
      const text = ta.value.trim();
      if (!text) { status.textContent = '先选一件事，或者写一句。'; ta.focus(); return; }
      const ok = () => { status.textContent = '已复制到剪贴板。'; };
      const fail = () => { ta.focus(); ta.select(); let done = false; try { done = doc.execCommand('copy'); } catch (e) { done = false; } status.textContent = done ? '已复制到剪贴板。' : '未能自动复制，已选中文字，可手动复制。'; };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fail); else fail();
    });
    state.task = 0; markTask.new(0); compose();
  })();

  /* ---------------- 下载入口：填入正式链接后生效；未填时如实说明 ---------------- */
  (function download() {
    const box = $('[data-download]'), status = $('[data-download-status]'); if (!box || !status) return;
    $$('button', box).forEach(b => b.addEventListener('click', () => {
      const href = b.dataset.href; if (href) { window.location.href = href; return; }
      status.textContent = `演示版本：${b.dataset.platform === 'windows' ? 'Windows' : 'macOS'} 版的下载入口尚未接入，不提供安装包。`;
      status.classList.remove('is-pulse'); void status.offsetWidth; status.classList.add('is-pulse');
    }));
  })();
})();
