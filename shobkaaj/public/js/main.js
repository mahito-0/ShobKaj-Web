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
    <div class="inner">
      <div class="brand"><a href="/"><span>${i18n.t('appName')}</span></a></div>
      <div class="nav-links">
        <a href="/jobs.html" data-i18n="nav.jobs">${i18n.t('nav.jobs')}</a>
        <a href="/workers.html" data-i18n="nav.workers">${i18n.t('nav.workers')}</a>
        <a href="/notifications.html" class="bell" title="Notifications">
          <span>🔔</span>
          <span id="notifCount" class="count" style="display:none">0</span>
        </a>
        ${user ? `
          <a href="/my-jobs.html" data-i18n="nav.myJobs">${i18n.t('nav.myJobs')}</a>
          <a href="/dashboard.html" data-i18n="nav.dashboard">${i18n.t('nav.dashboard')}</a>
          <a href="/chat.html" data-i18n="nav.chat">${i18n.t('nav.chat')}</a>
          ${user.role === 'client' ? `<a href="/post-job.html" class="btn" data-i18n="nav.postJob">${i18n.t('nav.postJob')}</a>` : ''}
          <a href="/profile.html" class="btn outline" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>
          ${user.role === 'admin' ? `<a href="/admin.html" class="btn outline" data-i18n="nav.admin">${i18n.t('nav.admin')}</a>` : ''}
          <img class="avatar" src="${avatar}" onerror="this.src='/img/avatar.png'"/>
          <button class="btn outline" id="logoutBtn" data-i18n="nav.logout">${i18n.t('nav.logout')}</button>
        ` : `
          <a href="/login.html" class="btn" data-i18n="nav.login">${i18n.t('nav.login')}</a>
          <a href="/register.html" class="btn outline" data-i18n="nav.register">${i18n.t('nav.register')}</a>
        `}
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