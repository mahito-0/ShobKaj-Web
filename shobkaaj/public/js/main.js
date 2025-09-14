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
  const navbarEl = document.getElementById('navbar');
  if (!navbarEl) return;
  const avatar = user?.avatar || '/img/avater.png';
  const currentPath = window.location.pathname || '/';

  // Update hero profile pill on the homepage
  if (currentPath === '/index.html' || currentPath === '/') {
    const heroProfilePill = document.querySelector('.hero-section .profile-pill');
    if (heroProfilePill) {
      if (user) {
        const avatarElement = heroProfilePill.querySelector('.avatar');
        const nameElement = heroProfilePill.querySelector('span');
        
        if (avatarElement) {
          avatarElement.style.backgroundImage = `url('${avatar}')`;
          avatarElement.style.backgroundSize = 'cover';
          avatarElement.style.backgroundPosition = 'center';
          avatarElement.textContent = ''; // Clear any existing content like initials
          avatarElement.setAttribute('aria-label', user.name); // Add accessibility
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

  let navItems = [];
  let primaryCTA = null;

  if (user) {
    if (user.role === 'admin') {
      navItems = [
        { href: '/admin.html', text: i18n.t('nav.admin'), auth: true },
        { href: '/dashboard.html', text: i18n.t('nav.dashboard'), auth: true },
      ];
    } else {
      navItems = [
        { href: '/dashboard.html', text: i18n.t('nav.dashboard'), auth: true },
        { href: '/jobs.html', text: i18n.t('nav.jobs'), auth: true },
        { href: '/workers.html', text: i18n.t('nav.workers'), auth: true },
        { href: '/my-jobs.html', text: i18n.t('nav.myJobs'), auth: true },
        { href: '/post-job.html', text: i18n.t('nav.postJob'), auth: true, role: 'client' },
        { href: '/chat.html', text: i18n.t('nav.chat'), auth: true },
        { href: '/notifications.html', text: i18n.t('nav.notifications'), auth: true },

      ];

      if (user.role === 'client') {
        navItems = navItems.filter(item => item.href !== '/jobs.html');
      } else if (user.role === 'worker') {
        navItems = navItems.filter(item => item.href !== '/post-job.html' && item.href !== '/workers.html');
      }
    }
  }

  const isHomePage = currentPath === '/index.html' || currentPath === '/';
  const isLoginPage = currentPath === '/login.html';
  const isRegisterPage = currentPath === '/register.html';

  // Determine what auth buttons to show
  let authButtons = '';
  if (user) {
    authButtons = `
      <a href="/profile.html" style="display: flex; align-items: center; gap: 10px;">
          <img class="avatar" src="${avatar}" onerror="this.src='/img/avater.png'"/>
      </a>
      <button class="btn outline" id="logoutBtn" data-i18n="nav.logout">${i18n.t('nav.logout')}</button>
    `;
  } else {
    if (isHomePage) {
      // Home page: show both Login and Register
      authButtons = `
        <a href="/login.html" class="btn outline" data-i18n="nav.login">${i18n.t('nav.login')}</a>
        <a href="/register.html" class="btn outline" data-i18n="nav.register">${i18n.t('nav.register')}</a>
      `;
    } else if (isLoginPage) {
      // Login page: show only Register
      authButtons = `
        <a href="/register.html" class="btn outline" data-i18n="nav.register">${i18n.t('nav.register')}</a>
      `;
    } else if (isRegisterPage) {
      // Register page: show only Login
      authButtons = `
        <a href="/login.html" class="btn outline" data-i18n="nav.login">${i18n.t('nav.login')}</a>
      `;
    } else {
      // Other pages: show Register (default)
      authButtons = `
        <a href="/register.html" class="btn outline" data-i18n="nav.register">${i18n.t('nav.register')}</a>
      `;
    }
  }

  navbarEl.innerHTML = `
    <div class="inner">
      <div class="brand"><a href="/"><span>${i18n.t('appName')}</span></a></div>
      <button id="mobileMenuBtn" class="mobile-menu-toggle" aria-label="Toggle menu" aria-expanded="false">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      <div class="nav-links" id="navLinks">
        ${navItems.map(item => {
          if (item.auth && !user) return '';
          if (item.role && item.role !== user?.role) return '';
          return `<a href="${item.href}" class="nav-item${currentPath.endsWith(item.href) ? ' active' : ''}" data-i18n="${item.text}">${item.text}</a>`;
        }).join('')}
        ${authButtons}
        <select id="langSelect" class="input" style="width:auto;padding:0px 0px; background:transparent; border:none; font-size:inherit; font-family:inherit; cursor:pointer;" aria-label="${i18n.t('nav.language')}">
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

  i18n.apply(navbarEl);

  

  initNotifications(user);

  // Scroll shadow behavior
  //function applyScrollState() {
   // if (window.scrollY > 4) el.classList.add('scrolled');
   // else el.classList.remove('scrolled');
 // }
  // applyScrollState();
  // window.addEventListener('scroll', applyScrollState, { passive: true });

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