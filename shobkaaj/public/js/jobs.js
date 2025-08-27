let me = null, loc = null;
function esc(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

async function loadJobs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await $api('/api/jobs' + (qs ? `?${qs}` : ''));
  const wrap = document.getElementById('jobs');
  wrap.innerHTML = '';
  if (!data.jobs.length) { wrap.innerHTML = `<div class="card">${i18n.t('jobs.noJobs')}</div>`; return; }

  data.jobs.forEach(j => {
    const distance = (j.distanceKm != null) ? ` • ${j.distanceKm.toFixed(1)} km` : '';
    const statusCls = j.status === 'open' ? 'status-open' : (j.status === 'assigned' ? 'status-assigned' : 'status-completed');
    let actionHtml = '';
    if (me?.role === 'worker') {
      actionHtml = `
        <button class="btn" data-act="chat-client" data-id="${j.id}">${i18n.t('jobs.chatClient')}</button>
        ${j.status==='open' ? `<button class="btn outline" data-act="apply" data-id="${j.id}">${i18n.t('jobs.apply')}</button>` : ''}
      `;
    } else if (me?.role === 'client' && j.createdBy === me.id) {
      if (j.assignedTo) actionHtml = `<button class="btn outline" data-act="chat-worker" data-id="${j.id}">${i18n.t('jobs.chatWorker')}</button>`;
      else actionHtml = `<a class="btn outline" href="/my-jobs.html">${i18n.t('jobs.manage')}</a>`;
    }
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div>
        <div><strong>${esc(j.title)}</strong> <span class="badge ${statusCls}">${j.status}</span></div>
        <div class="small">Budget: ৳${j.budget} • ${esc(j.location?.address || 'N/A')} ${distance}</div>
        <div>${esc(j.description)}</div>
      </div>
      <div>${actionHtml}</div>
    `;
    wrap.appendChild(el);
  });

  wrap.onclick = async (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const jobId = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    try {
      if (act === 'chat-client' || act === 'chat-worker') {
        const { conversation } = await $api(`/api/jobs/${jobId}/chat`, { method: 'POST' });
        sessionStorage.setItem('openConv', conversation.id);
        window.location.href = '/chat.html';
      }
      if (act === 'apply') {
        const note = prompt(i18n.t('jobs.applyNotePrompt')) || '';
        await $api(`/api/jobs/${jobId}/apply`, { method: 'POST', body: { note } });
        alert(i18n.t('jobs.appliedSuccess'));
      }
    } catch (ex) { alert(ex.message); }
  };
}

(async () => {
  me = await $auth.requireAuth();
  if (!me) return;
  i18n.apply(document);

  const qInput = document.getElementById('q');
  const radiusInput = document.getElementById('radius');
  document.getElementById('searchBtn').setAttribute('data-i18n','common.search');
  i18n.apply(document);

  document.getElementById('searchBtn').onclick = () => {
    const params = { q: qInput.value.trim() };
    if (loc) { params.lat = loc.lat; params.lng = loc.lng; }
    const r = Number(radiusInput.value || 0); if (r > 0) params.radiusKm = r;
    loadJobs(params);
  };
  document.getElementById('nearBtn').onclick = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => { loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; document.getElementById('searchBtn').click(); },
      err => alert(i18n.t('common.locationDenied'))
    );
  };

  await loadJobs();
})();