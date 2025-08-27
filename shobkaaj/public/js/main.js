i18n.init();

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
  langSel.onchange = (e) => {
    i18n.setLang(e.target.value);
    // reload to ensure all pages (including dynamic parts) reflect the new language
    window.location.reload();
  };

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = () => $auth.logout();

  i18n.apply(el);
}

(async () => {
  const user = await $auth.getMe();
  renderNavbar(user);
})();