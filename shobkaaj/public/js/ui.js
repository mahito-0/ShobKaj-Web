// ShobKaaj UI Helpers: theme toggle, toasts, ripple, tooltips, reveal
(() => {
  const ui = {};

  // THEME TOGGLE (System/Light/Dark)
  const THEME_KEY = 'theme'; // 'system' | 'light' | 'dark'
  function applyTheme(mode) {
    const html = document.documentElement;
    if (mode === 'light') { html.setAttribute('data-theme', 'light'); }
    else if (mode === 'dark') { html.setAttribute('data-theme', 'dark'); }
    else { html.removeAttribute('data-theme'); } // system
  }
  function getTheme() { return localStorage.getItem(THEME_KEY) || 'system'; }
  function setTheme(mode) { localStorage.setItem(THEME_KEY, mode); applyTheme(mode); }
  function cycleTheme() {
    const order = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(getTheme()) + 1) % order.length];
    setTheme(next); toast(`Theme: ${next}`, { type: 'info' });
    renderThemeButton();
  }
  function renderThemeButton() {
    const nav = document.querySelector('#navbar .nav-links');
    if (!nav) return;
    let btn = document.getElementById('themeToggle');
    const mode = getTheme();
    const icon = mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '🌗';
    const title = `Theme: ${mode}`;
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'themeToggle';
      btn.className = 'btn outline';
      btn.style.display = 'inline-flex'; btn.style.alignItems = 'center'; btn.style.gap = '6px';
      btn.onclick = cycleTheme;
      nav.appendChild(btn);
    }
    btn.textContent = ''; // reset
    const span = document.createElement('span'); span.textContent = icon;
    const label = document.createElement('span'); label.textContent = title;
    btn.appendChild(span); btn.appendChild(label);
  }
  applyTheme(getTheme());
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });
  document.addEventListener('DOMContentLoaded', renderThemeButton);

  // TOASTS (also overrides alert())
  let toastWrap = null;
  function ensureToastWrap() {
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'toasts';
      document.body.appendChild(toastWrap);
    }
  }
  function toast(msg, { type = 'info', timeout = 3000 } = {}) {
    ensureToastWrap();
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = `<div>${msg}</div><div class="close" aria-label="Close">✕</div>`;
    toastWrap.appendChild(t);
    const closer = t.querySelector('.close');
    closer.onclick = () => t.remove();
    const timer = setTimeout(() => t.remove(), timeout);
    t.addEventListener('pointerenter', () => clearTimeout(timer), { once: true });
    return t;
  }
  // Replace blocking alerts
  const nativeAlert = window.alert.bind(window);
  window.alert = (msg) => toast(String(msg), { type: 'info' });

  ui.toast = toast;

  // RIPPLE on .btn, .item, .card
  function addRipple(e) {
    const el = e.target.closest('.btn, .item, .card');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }
  document.addEventListener('pointerdown', addRipple);

  // TOOLTIP: use data-tip
  let tipEl = null;
  function ensureTip() {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'tooltip';
      document.body.appendChild(tipEl);
    }
  }
  let tipTarget = null;
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-tip]');
    ensureTip();
    if (t) {
      tipTarget = t;
      tipEl.textContent = t.getAttribute('data-tip') || '';
      tipEl.classList.add('show');
    }
  });
  document.addEventListener('mousemove', (e) => {
    if (!tipEl || !tipEl.classList.contains('show')) return;
    tipEl.style.left = e.pageX + 'px';
    tipEl.style.top = e.pageY + 'px';
  });
  document.addEventListener('mouseout', (e) => {
    if (tipEl && (e.target === tipTarget || e.target.closest('[data-tip]'))) {
      tipEl.classList.remove('show');
      tipTarget = null;
    }
  });

  // MODAL helper
  function modal({ title = 'Dialog', content = '', actions = [] } = {}) {
    const back = document.createElement('div'); back.className = 'modal-backdrop show';
    const box = document.createElement('div'); box.className = 'modal';
    box.innerHTML = `
      <header><strong>${title}</strong></header>
      <div class="content">${content}</div>
      <footer></footer>
    `;
    const footer = box.querySelector('footer');
    actions.forEach(a => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.variant || 'outline');
      b.textContent = a.label || 'OK';
      b.onclick = () => { a.onClick?.(); back.remove(); };
      footer.appendChild(b);
    });
    back.appendChild(box);
    back.addEventListener('click', (e)=> { if (e.target === back) back.remove(); });
    document.body.appendChild(back);
    return back;
  }
  ui.modal = modal;

  // REVEAL on scroll for .card, .item, .conv
  const toReveal = new Set();
  function observeReveal() {
    const els = document.querySelectorAll('.card, .item, .conv');
    els.forEach(el => {
      if (el.classList.contains('reveal') || el.classList.contains('reveal-ready')) return;
      el.classList.add('reveal');
      toReveal.add(el);
    });
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  const revealInit = () => {
    observeReveal();
    toReveal.forEach(el => io.observe(el));
  };
  document.addEventListener('DOMContentLoaded', revealInit);

  // Expose UI globally
  window.ui = ui;

  // NICE: show toasts for Socket notifications (if socket.io is loaded)
  const notifySocket = () => {
    const socket = window.io && window.io();
    if (!socket) return;
    socket.close(); // don't create a second connection; we just detect availability
  };
  // Optional: auto-toasts for push-triggered events via Service Worker messages are handled by SW.

})();