let me=null;
function timeAgo(ts){
  const s = Math.floor((Date.now() - ts)/1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s/60); if (m < 60) return m + 'm';
  const h = Math.floor(m/60); if (h < 24) return h + 'h';
  const d = Math.floor(h/24); return d + 'd';
}
function row(n){
  const wrap = document.createElement('div');
  wrap.className = 'item' + (n.read ? '' : ' n-unread');
  wrap.innerHTML = `
    <div style="flex:1;min-width:0">
      <div class="n-title">${n.title || 'Notification'} ${!n.read ? '<span class="dot-unread" title="unread"></span>' : ''}</div>
      <div class="n-body">${n.body || ''}</div>
      <div class="n-time">${timeAgo(n.createdAt)}</div>
    </div>
    <div class="n-actions">
      ${n.url ? `<a href="${n.url}" class="btn outline" data-i18n="notifications.view">${i18n.t('notifications.view')}</a>` : ''}
      ${!n.read ? `<button class="btn sm" data-act="read" data-id="${n.id}">Mark read</button>` : ''}
    </div>
  `;
  return wrap;
}
async function load(unreadOnly=false){
  const { notifications } = await $api('/api/notifications' + (unreadOnly ? '?unread=1' : ''));
  const list = document.getElementById('list');
  list.innerHTML = '';
  if (!notifications.length) {
    const c = document.createElement('div'); c.className='card'; c.setAttribute('data-i18n','notifications.empty'); c.textContent = i18n.t('notifications.empty');
    list.appendChild(c); return;
  }
  notifications.forEach(n => list.appendChild(row(n)));
  list.onclick = async (e)=>{
    const btn = e.target.closest('button[data-act="read"]'); if (!btn) return;
    const id = btn.getAttribute('data-id');
    await $api('/api/notifications/read', { method:'POST', body:{ ids:[id] } });
    await load(document.getElementById('unreadOnly').checked);
    // also update bell count in navbar
    try {
      const { notifications } = await $api('/api/notifications?unread=1');
      const el = document.getElementById('notifCount');
      if (el) { const c = notifications.length; el.style.display = c ? 'inline-block' : 'none'; el.textContent = c ? (c>99?'99+':c) : '0'; }
    } catch {}
  };
}

(async ()=>{
  me = await $auth.requireAuth();
  if (!me) return;
  i18n.apply(document);
  const unreadOnly = document.getElementById('unreadOnly');
  unreadOnly.addEventListener('change', ()=> load(unreadOnly.checked));
  document.getElementById('markAllBtn').onclick = async ()=>{
    await $api('/api/notifications/read-all', { method:'POST' });
    await load(unreadOnly.checked);
    // refresh bell
    try {
      const { notifications } = await $api('/api/notifications?unread=1');
      const el = document.getElementById('notifCount');
      if (el) { const c = notifications.length; el.style.display = c ? 'inline-block' : 'none'; el.textContent = c ? (c>99?'99+':c) : '0'; }
    } catch {}
  };
  await load(false);
})();