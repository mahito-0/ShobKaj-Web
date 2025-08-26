function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

async function initPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    const { key } = await $api('/api/notifications/public-key');
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });
    await $api('/api/notifications/subscribe', { method: 'POST', body: sub });
    navigator.serviceWorker.addEventListener('message', (e)=>{
      if (e.data?.type === 'navigate' && e.data.url) window.location.href = e.data.url;
    });
  } catch (e) { /* ignore */ }
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
  langSel.onchange = (e) => { i18n.setLang(e.target.value); renderNavbar(user); i18n.apply(document); };

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = () => $auth.logout();

  i18n.apply(el);
}

(async () => {
  const user = await $auth.getMe();
  renderNavbar(user);
  if (user) await initPush();
})();