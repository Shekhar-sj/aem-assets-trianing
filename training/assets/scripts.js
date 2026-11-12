(() => {
  const body = document.body;
  const STORE = body.dataset.progressKey || 'training-progress';
  const THEME = `${STORE}-theme`;
  const sections = [...document.querySelectorAll('main .section')];
  const rail = document.getElementById('rail');
  const mobileNav = document.getElementById('mobileNav');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
  };
  let state = load();
  const save = () => localStorage.setItem(STORE, JSON.stringify(state));

  // Assign stable keys to every checkbox so progress survives reloads.
  sections.forEach((sec) => {
    sec.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => {
      if (!cb.dataset.key) cb.dataset.key = `${sec.id}-${i}`;
    });
  });

  // Build sidebar rail and mobile select from the sections.
  sections.forEach((sec) => {
    const title = sec.dataset.title;
    const node = document.createElement('div');
    node.className = 'rail-node';
    const counted = sec.querySelector('input[type="checkbox"]');
    node.innerHTML = `<a class="rail-link" href="#${sec.id}" data-target="${sec.id}"><span class="rail-dot"></span>${title}${counted ? `<span class="rail-label-count" data-count-for="${sec.id}"></span>` : ''}</a>`;
    rail.appendChild(node);
    const opt = document.createElement('option');
    opt.value = sec.id;
    opt.textContent = title;
    mobileNav.appendChild(opt);
  });

  const refresh = () => {
    let total = 0;
    let done = 0;
    sections.forEach((sec) => {
      const boxes = [...sec.querySelectorAll('input[type="checkbox"]')];
      if (!boxes.length) return;
      const d = boxes.filter((b) => b.checked).length;
      total += boxes.length;
      done += d;
      const count = rail.querySelector(`[data-count-for="${sec.id}"]`);
      if (count) count.textContent = `${d}/${boxes.length}`;
      const dot = rail.querySelector(`[data-target="${sec.id}"] .rail-dot`);
      dot.classList.toggle('done', d === boxes.length);
      dot.classList.toggle('in-progress', d > 0 && d < boxes.length);
    });
    document.getElementById('progressLabel').textContent = `${done} / ${total}`;
    document.getElementById('progressBarFill').style.width = total ? `${Math.round((done / total) * 100)}%` : '0';
    const ov = rail.querySelector('[data-target="overview"] .rail-dot');
    if (ov) ov.classList.toggle('done', !!state.__visited);
  };

  document.querySelectorAll('main input[type="checkbox"]').forEach((cb) => {
    cb.checked = !!state[cb.dataset.key];
    const card = cb.closest('.assignment');
    if (card) card.classList.toggle('done', cb.checked);
    cb.addEventListener('change', () => {
      state[cb.dataset.key] = cb.checked;
      if (card) card.classList.toggle('done', cb.checked);
      save();
      refresh();
    });
  });

  const show = (id, scroll = true) => {
    const idx = Math.max(0, sections.findIndex((s) => s.id === id));
    sections.forEach((s, i) => s.classList.toggle('active', i === idx));
    rail.querySelectorAll('.rail-link').forEach((a) => a.classList.toggle('active', a.dataset.target === sections[idx].id));
    mobileNav.value = sections[idx].id;
    const prev = sections[idx - 1];
    const next = sections[idx + 1];
    prevBtn.disabled = !prev;
    nextBtn.disabled = !next;
    document.getElementById('prevTitle').textContent = prev ? prev.dataset.title : '';
    document.getElementById('nextTitle').textContent = next ? next.dataset.title : '';
    prevBtn.onclick = () => prev && (location.hash = prev.id);
    nextBtn.onclick = () => next && (location.hash = next.id);
    if (sections[idx].id === 'overview' && !state.__visited) { state.__visited = true; save(); }
    refresh();
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const route = () => {
    const raw = decodeURIComponent(location.hash.slice(1));
    if (!raw) return show('overview', false);
    if (sections.some((s) => s.id === raw)) return show(raw);
    // Deep link to an element inside a section.
    const el = document.getElementById(raw);
    const sec = el && el.closest('.section');
    if (sec) { show(sec.id, false); el.scrollIntoView({ behavior: 'smooth' }); } else show('overview');
  };
  window.addEventListener('hashchange', route);
  mobileNav.addEventListener('change', () => { location.hash = mobileNav.value; });
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { location.hash = b.dataset.goto; }));

  document.querySelectorAll('.vocab-card').forEach((c) => c.addEventListener('click', () => c.classList.toggle('open')));

  const applyTheme = (t) => { body.dataset.theme = t; localStorage.setItem(THEME, t); };
  applyTheme(localStorage.getItem(THEME) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  document.getElementById('themeToggle').addEventListener('click', () => applyTheme(body.dataset.theme === 'dark' ? 'light' : 'dark'));

  document.getElementById('resetProgress').addEventListener('click', () => {
    if (!confirm('Reset all progress for this training?')) return;
    state = {};
    save();
    document.querySelectorAll('main input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
      const card = cb.closest('.assignment');
      if (card) card.classList.remove('done');
    });
    refresh();
  });

  const toTop = document.getElementById('toTop');
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  route();
})();
