i18n.init();

function updateBell(count) {
  const el = document.getElementById('notifCount');
  if (!el) return;
  if (count > 0) { el.style.display = 'inline-block'; el.textContent = count > 99 ? '99+' : String(count); }
  else { el.style.display = 'none'; el.textContent = '0'; }
}

async function initNotifications(user) {
  if (!user) return;
  // Fetch unread count initially
  try {
    const { notifications } = await $api('/api/notifications?unread=1');
    updateBell(notifications.length || 0);
  } catch {}

  // Load socket.io client dynamically
  function ensureSocket() {
    return new Promise((resolve) => {
      if (window.io) return resolve(window.io);
      const s = document.createElement('script');
      s.src = '/socket.io/socket.io.js';
      s.onload = () => resolve(window.io);
      document.head.appendChild(s);
    });
  }

  const ioFactory = await ensureSocket();
  const socket = ioFactory({ withCredentials: true });
  socket.on('notify', (n) => {
    // increase bell count
    const el = document.getElementById('notifCount');
    const curr = Number(el?.textContent || 0) || 0;
    updateBell(curr + 1);
  });
}

function renderNavbar(user) {
  const el = document.getElementById('navbar');
  if (!el) return;
  const avatar = user?.avatar || '/img/avater.png';
  const path = window.location.pathname || '/';
  function getPrimaryCTA() {
    if (!user) {
      if (path.endsWith('/login.html')) return { href: '/register.html', text: i18n.t('nav.register') };
      return { href: '/login.html', text: i18n.t('nav.login') };
    }
    if (user.role === 'client') {
      return { href: '/post-job.html', text: i18n.t('nav.postJob') };
    }
    return { href: '/jobs.html', text: i18n.t('nav.jobs') };
  }
  const primaryCTA = getPrimaryCTA();
  el.innerHTML = `
    <div class="inner">
      <div class="brand"><a href="/"><span>${i18n.t('appName')}</span></a></div>
      <button id="mobileMenuBtn" class="mobile-menu-toggle" aria-label="Toggle menu" aria-expanded="false">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      <div class="nav-links" id="navLinks">
        ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn primary-action">${primaryCTA.text}</a>` : ''}
        <a href="/jobs.html" class="nav-item${path.endsWith('/jobs.html') ? ' active' : ''}" data-i18n="nav.jobs">${i18n.t('nav.jobs')}</a>
        <a href="/workers.html" class="nav-item${path.endsWith('/workers.html') ? ' active' : ''}" data-i18n="nav.workers">${i18n.t('nav.workers')}</a>
        <a href="/notifications.html" class="bell" title="Notifications">
          <span>🔔</span>
          <span id="notifCount" class="count" style="display:none">0</span>
        </a>
        ${user ? `
          <a href="/my-jobs.html" class="nav-item${path.endsWith('/my-jobs.html') ? ' active' : ''}" data-i18n="nav.myJobs">${i18n.t('nav.myJobs')}</a>
          <a href="/dashboard.html" class="nav-item${path.endsWith('/dashboard.html') ? ' active' : ''}" data-i18n="nav.dashboard">${i18n.t('nav.dashboard')}</a>
          <a href="/chat.html" class="nav-item${path.endsWith('/chat.html') ? ' active' : ''}" data-i18n="nav.chat">${i18n.t('nav.chat')}</a>
          <a href="/profile.html" class="btn outline${path.endsWith('/profile.html') ? ' active' : ''}" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>
          ${user.role === 'admin' ? `<a href="/admin.html" class="btn outline${path.endsWith('/admin.html') ? ' active' : ''}" data-i18n="nav.admin">${i18n.t('nav.admin')}</a>` : ''}
          <img class="avatar" src="${avatar}" onerror="this.src='/img/avater.png'"/>
          <button class="btn outline" id="logoutBtn" data-i18n="nav.logout">${i18n.t('nav.logout')}</button>
        ` : ``}
        <select id="langSelect" class="input" style="width:auto;padding:6px 8px;">
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  `;
  const langSel = document.getElementById('langSelect');
  langSel.value = i18n.lang;
  langSel.onchange = (e) => { i18n.setLang(e.target.value); window.location.reload(); };

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = () => $auth.logout();

  i18n.apply(el);
  initNotifications(user);

  // Scroll shadow behavior
  function applyScrollState() {
    if (window.scrollY > 4) el.classList.add('scrolled');
    else el.classList.remove('scrolled');
  }
  applyScrollState();
  window.addEventListener('scroll', applyScrollState, { passive: true });

  // Mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const links = document.getElementById('navLinks');
  if (menuBtn && links) {
    menuBtn.onclick = () => {
      const open = links.classList.toggle('open');
      menuBtn.classList.toggle('active', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    };
    // Close when navigating
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      if (links.classList.contains('open')) {
        links.classList.remove('open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }
    }));
  }
}

(async () => {
  const user = await $auth.getMe();
  // Create a navbar shell on pages that didn't have it
  if (!document.getElementById('navbar')) {
    const nav = document.createElement('nav'); nav.id = 'navbar'; nav.className = 'navbar';
    document.body.prepend(nav);
  }
  renderNavbar(user);

  // Register Service Worker for web push and notifications
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      // Optional: listen for navigate message from SW
      navigator.serviceWorker.addEventListener('message', (evt) => {
        if (evt?.data?.type === 'navigate' && evt.data.url) {
          window.location.href = evt.data.url;
        }
      });
    } catch (e) { /* ignore */ }
  }
})();