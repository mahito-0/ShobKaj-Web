let me=null;
let loc=null;

function esc(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

function cardWorker(w) {
  const dist = (w.distanceKm != null) ? `${w.distanceKm.toFixed(1)} km` : '';
  const skills = (w.skills||[]).join(', ');
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `
    <div>
      <div><strong>${esc(w.name)}</strong> <span class="badge">${(w.rating||0).toFixed(1)}★</span></div>
      <div class="small">${esc(skills || 'No skills')}${dist ? ' • ' + dist : ''}</div>
      <div class="small">${esc(w.location?.address || '')}</div>
    </div>
    <div>
      <button class="btn" data-id="${w.id}" data-act="chat">${i18n.t('workers.startChat')}</button>
    </div>
  `;
  return div;
}

async function searchWorkers() {
  const skill = document.getElementById('skill').value.trim();
  const radius = document.getElementById('radius').value;
  const minRating = document.getElementById('minRating').value;
  const params = new URLSearchParams();
  if (skill) params.set('skill', skill);
  if (loc) { params.set('lat', loc.lat); params.set('lng', loc.lng); }
  if (radius) params.set('radiusKm', radius);
  if (minRating) params.set('minRating', minRating);
  const { workers } = await $api('/api/workers?' + params.toString());
  const wrap = document.getElementById('results');
  wrap.innerHTML = '';
  if (!workers.length) { wrap.innerHTML = '<div class="card">No workers found</div>'; return; }
  workers.forEach(w => wrap.appendChild(cardWorker(w)));
}

(async ()=>{
  me = await $auth.requireAuth();
  if (!me) return;

  i18n.apply(document);

  document.getElementById('nearBtn').onclick = ()=>{
    navigator.geolocation?.getCurrentPosition(
      pos => { loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; searchWorkers(); },
      err => alert('Location permission denied')
    );
  };
  document.getElementById('searchBtn').onclick = searchWorkers;

  document.getElementById('results').onclick = async (e)=>{
    const btn = e.target.closest('button'); if (!btn) return;
    if (btn.getAttribute('data-act') !== 'chat') return;
    const id = btn.getAttribute('data-id');
    try {
      const { conversation } = await $api('/api/conversations', { method:'POST', body:{ otherUserId: id }});
      sessionStorage.setItem('openConv', conversation.id);
      window.location.href = '/chat.html';
    } catch(ex){ alert(ex.message); }
  };

  await searchWorkers();
})();