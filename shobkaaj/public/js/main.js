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
        <button id="themeToggle" class="theme-toggle" aria-label="Toggle theme" title="Toggle dark/light theme">
          <svg id="themeIcon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
          </svg>
        </button>
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

  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  
  if (themeToggle && themeIcon) {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // Apply initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update theme icon based on current theme
    if (currentTheme === 'dark') {
      // Sun icon for dark mode (click to go to light)
      themeIcon.innerHTML = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/>';
    } else {
      // Moon icon for light mode (click to go to dark)
      themeIcon.innerHTML = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';
    }
    
    // Theme toggle handler
    themeToggle.onclick = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      console.log('Theme toggle clicked:', { currentTheme, newTheme });
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update icon
      if (newTheme === 'dark') {
        // Sun icon for dark mode (click to go to light)
        themeIcon.innerHTML = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/>';
      } else {
        // Moon icon for light mode (click to go to dark)
        themeIcon.innerHTML = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';
      }
      
      console.log('Theme applied:', document.documentElement.getAttribute('data-theme'));
    };
  }

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