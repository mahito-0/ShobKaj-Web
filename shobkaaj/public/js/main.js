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

  // Update hero profile pill on the homepage
  if (path === '/index.html' || path === '/') {
    const heroProfilePill = document.querySelector('.hero-section .profile-pill');
    if (heroProfilePill) {
      if (user) {
        const avatarElement = heroProfilePill.querySelector('.avatar');
        const nameElement = heroProfilePill.querySelector('span');
        
        if (avatarElement) {
          avatarElement.src = avatar;
          avatarElement.alt = user.name;
        }
        if (nameElement) {
          nameElement.textContent = user.name;
        }
        heroProfilePill.style.display = 'flex';
      } else {
        heroProfilePill.style.display = 'none';
      }
    }
  }

  // Define navigation items for different pages and user roles
  const allNavItems = [
    { href: '/workers.html', text: i18n.t('nav.workers'), auth: false },
    { href: '/my-jobs.html', text: i18n.t('nav.myJobs'), auth: true },
    { href: '/dashboard.html', text: i18n.t('nav.dashboard'), auth: true },
    { href: '/profile.html', text: i18n.t('nav.profile'), auth: true },
    { href: '/chat.html', text: i18n.t('nav.chat'), auth: true },
    { href: '/admin.html', text: i18n.t('nav.admin'), auth: true, role: 'admin' },
    { href: '/login.html', text: i18n.t('nav.login'), auth: false },
    { href: '/register.html', text: i18n.t('nav.register'), auth: false },
  ];

  // If there's a logged-in user, remove login/register from the nav items
  let visibleNavItems = user
    ? allNavItems.filter(it => it.href !== '/login.html' && it.href !== '/register.html')
    : allNavItems.slice();

  // Role-specific exclusions:
  // - clients should not see the "jobs" nav item
  // - workers should not see the "workers" nav item
  if (user) {
    if (user.role === 'client') {
      visibleNavItems = visibleNavItems.filter(it => it.href !== '/jobs.html');
    }
    if (user.role === 'worker') {
      visibleNavItems = visibleNavItems.filter(it => it.href !== '/workers.html');
    }
  }

  const navConfig = {
    '/index.html': [...visibleNavItems],
    '/': [...visibleNavItems],
    '/login.html': [...visibleNavItems],
    '/register.html': [...visibleNavItems],
    '/jobs.html': [...visibleNavItems],
    '/workers.html': [...visibleNavItems],
    '/post-job.html': [...visibleNavItems],
    '/my-jobs.html': [...visibleNavItems],
    '/dashboard.html': [...visibleNavItems],
    '/profile.html': [...visibleNavItems],
    '/chat.html': [...visibleNavItems],
    '/notifications.html': [...visibleNavItems],
    '/admin.html': [...visibleNavItems],
  };

  // Get the navigation items for the current page
  const currentPath = path.endsWith('/') ? '/index.html' : path;
  const navItems = navConfig[currentPath] || [];

  // Filter nav items based on user authentication and role
  const filteredNavItems = navItems.filter(item => {
    if (item.auth && !user) return false;
    if (item.role && user && user.role !== item.role) return false;
    return true;
  });

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
        ${filteredNavItems.map(item => `
          <a href="${item.href}" class="nav-item${path.endsWith(item.href) ? ' active' : ''}" data-i18n="${item.text}">${item.text}</a>
        `).join('')}
        <a href="/notifications.html" class="bell" title="Notifications">
          <span>🔔</span>
          <span id="notifCount" class="count" style="display:none">0</span>
        </a>
        ${user ? `
          <div class="avatar-dropdown" tabindex="0">
            <img class="avatar" id="avatarDropdown" src="${avatar}" onerror="this.src='/img/avater.png'"/>
            <div class="dropdown-content" id="dropdownContent">
              <a href="/profile.html" class="btn outline${path.endsWith('/profile.html') ? ' active' : ''}" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>
              ${user.role === 'admin' ? `<a href="/admin.html" class="btn outline${path.endsWith('/admin.html') ? ' active' : ''}" data-i18n="nav.admin">${i18n.t('nav.admin')}</a>` : ''}
              <button class="btn outline" id="logoutBtn" data-i18n="nav.logout">${i18n.t('nav.logout')}</button>
            </div>
          </div>
        ` : ``}
        <select id="langSelect" class="input" style="width:auto;padding:0px 0px;">
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

  const avatarDropdown = el.querySelector('.avatar-dropdown');
  if (avatarDropdown) {
    const dropdownContent = avatarDropdown.querySelector('.dropdown-content');
    avatarDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownContent.classList.toggle('show');
    });
    avatarDropdown.addEventListener('focusout', (e) => {
        if (!avatarDropdown.contains(e.relatedTarget)) {
            dropdownContent.classList.remove('show');
        }
    });
  }

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