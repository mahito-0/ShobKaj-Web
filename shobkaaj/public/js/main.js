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
  const avatar = user?.avatar || '/img/avatar.png';
  el.innerHTML = `
    <div class="navbar-container">
      <div class="navbar-inner">
        <!-- Brand -->
        <a href="/" class="navbar-brand">
          <span>${i18n.t('appName')}</span>
        </a>
        
        <!-- Desktop Navigation -->
        <nav class="navbar-nav">
          <div class="nav-item">
            <a href="/jobs.html" class="nav-link" data-i18n="nav.jobs">${i18n.t('nav.jobs')}</a>
          </div>
          <div class="nav-item">
            <a href="/workers.html" class="nav-link" data-i18n="nav.workers">${i18n.t('nav.workers')}</a>
          </div>
          ${user ? `
            <div class="nav-item">
              <a href="/dashboard.html" class="nav-link" data-i18n="nav.dashboard">${i18n.t('nav.dashboard')}</a>
            </div>
            <div class="nav-item">
              <a href="/my-jobs.html" class="nav-link" data-i18n="nav.myJobs">${i18n.t('nav.myJobs')}</a>
            </div>
            <div class="nav-item">
              <a href="/chat.html" class="nav-link" data-i18n="nav.chat">${i18n.t('nav.chat')}</a>
            </div>
          ` : ''}
        </nav>
        
        <!-- Mobile Toggle -->
        <button class="mobile-nav-toggle" id="mobileToggle" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <!-- Right Actions -->
        <div class="navbar-actions">
          ${user ? `
            <!-- Notifications -->
            <a href="/notifications.html" class="bell" title="Notifications">
              <span>🔔</span>
              <span id="notifCount" class="count" style="display:none">0</span>
            </a>
            
            <!-- Post Job Button -->
            ${user.role === 'client' ? `<a href="/post-job.html" class="btn" data-i18n="nav.postJob">${i18n.t('nav.postJob')}</a>` : ''}
            
            <!-- User Menu -->
            <div class="user-menu">
              <img class="avatar" src="${avatar}" onerror="this.src='/img/avatar.png'" title="${user.name || user.email}"/>
              <div class="user-dropdown">
                <a href="/profile.html" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>
                ${user.role === 'admin' ? `<a href="/admin.html" data-i18n="nav.admin">${i18n.t('nav.admin')}</a>` : ''}
                <button id="logoutBtn" data-i18n="nav.logout">${i18n.t('nav.logout')}</button>
              </div>
            </div>
          ` : `
            <!-- Guest Actions -->
            <a href="/login.html" class="btn outline" data-i18n="nav.login">${i18n.t('nav.login')}</a>
            <a href="/register.html" class="btn" data-i18n="nav.register">${i18n.t('nav.register')}</a>
          `}
          
          <!-- Language Selector -->
          <select id="langSelect" class="lang-select">
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      
      <!-- Mobile Navigation Menu -->
      <div class="mobile-nav-menu" id="mobileMenu">
        <nav class="navbar-nav">
          <div class="nav-item">
            <a href="/jobs.html" class="nav-link" data-i18n="nav.jobs">${i18n.t('nav.jobs')}</a>
          </div>
          <div class="nav-item">
            <a href="/workers.html" class="nav-link" data-i18n="nav.workers">${i18n.t('nav.workers')}</a>
          </div>
          ${user ? `
            <div class="nav-item">
              <a href="/dashboard.html" class="nav-link" data-i18n="nav.dashboard">${i18n.t('nav.dashboard')}</a>
            </div>
            <div class="nav-item">
              <a href="/my-jobs.html" class="nav-link" data-i18n="nav.myJobs">${i18n.t('nav.myJobs')}</a>
            </div>
            <div class="nav-item">
              <a href="/chat.html" class="nav-link" data-i18n="nav.chat">${i18n.t('nav.chat')}</a>
            </div>
          ` : ''}
        </nav>
        
        <div class="navbar-actions">
          ${user ? `
            <a href="/notifications.html" class="bell" title="Notifications">
              <span>🔔</span>
              <span class="count" style="display:none">0</span>
            </a>
            ${user.role === 'client' ? `<a href="/post-job.html" class="btn" data-i18n="nav.postJob">${i18n.t('nav.postJob')}</a>` : ''}
            <div class="user-menu">
              <div class="user-info">
                <img class="avatar" src="${avatar}" onerror="this.src='/img/avatar.png'"/>
                <span>${user.name || user.email}</span>
              </div>
              <div class="user-actions">
                <a href="/profile.html" class="btn ghost" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>
                ${user.role === 'admin' ? `<a href="/admin.html" class="btn ghost" data-i18n="nav.admin">${i18n.t('nav.admin')}</a>` : ''}
                <button id="logoutBtnMobile" class="btn destructive" data-i18n="nav.logout">${i18n.t('nav.logout')}</button>
              </div>
            </div>
          ` : `
            <a href="/login.html" class="btn outline" data-i18n="nav.login">${i18n.t('nav.login')}</a>
            <a href="/register.html" class="btn" data-i18n="nav.register">${i18n.t('nav.register')}</a>
          `}
        </div>
      </div>
    </div>
  `;
  // Language selector
  const langSel = document.getElementById('langSelect');
  if (langSel) {
    langSel.value = i18n.lang;
    langSel.onchange = (e) => { i18n.setLang(e.target.value); window.location.reload(); };
  }

  // Logout buttons
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = () => $auth.logout();
  
  const logoutBtnMobile = document.getElementById('logoutBtnMobile');
  if (logoutBtnMobile) logoutBtnMobile.onclick = () => $auth.logout();

  // User dropdown functionality
  const userMenus = el.querySelectorAll('.user-menu');
  userMenus.forEach(userMenu => {
    const avatar = userMenu.querySelector('.avatar');
    const dropdown = userMenu.querySelector('.user-dropdown');
    
    if (avatar && dropdown) {
      // Toggle dropdown on avatar click
      avatar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Close other dropdowns first
        document.querySelectorAll('.user-menu.active').forEach(menu => {
          if (menu !== userMenu) {
            menu.classList.remove('active');
          }
        });
        
        userMenu.classList.toggle('active');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
          userMenu.classList.remove('active');
        }
      });
      
      // Close dropdown when clicking on dropdown links
      dropdown.addEventListener('click', (e) => {
        if (e.target.matches('a')) {
          userMenu.classList.remove('active');
        }
      });
    }
  });

  // Mobile navigation toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.onclick = () => {
      mobileToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    };
    
    // Close mobile menu when clicking on links
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.matches('a, button')) {
        mobileToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!el.contains(e.target)) {
        mobileToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });
  }

  // Apply active states to navigation links
  const currentPath = window.location.pathname;
  el.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // Add scroll effect to navbar
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      el.classList.add('scrolled');
    } else {
      el.classList.remove('scrolled');
    }
    lastScrollY = window.scrollY;
  });

  i18n.apply(el);
  initNotifications(user);
}

(async () => {
  const user = await $auth.getMe();
  // Create a navbar shell on pages that didn't have it
  if (!document.getElementById('navbar')) {
    const nav = document.createElement('nav'); nav.id = 'navbar'; nav.className = 'navbar';
    document.body.prepend(nav);
  }
  renderNavbar(user);
})();