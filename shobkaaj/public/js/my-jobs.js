let me=null;
function esc(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

function ratingWidget(container) {
  let value = 5;
  const wrap = document.createElement('div'); wrap.className = 'rating';
  for (let i=1; i<=5; i++) {
    const s = document.createElement('span');
    s.textContent = '★'; s.className = 'star' + (i<=value ? ' active' : '');
    s.onclick = ()=>{ value = i; [...wrap.children].forEach((c, idx)=> c.classList.toggle('active', idx < value)); };
    wrap.appendChild(s);
  }
  container.appendChild(wrap);
  return { get value(){ return value; } };
}

async function openChat(jobId) {
  const { conversation } = await $api(`/api/jobs/${jobId}/chat`, { method:'POST' });
  sessionStorage.setItem('openConv', conversation.id);
  window.location.href = '/chat.html';
}

async function loadClientView() {
  const { myJobs } = await $api('/api/jobs/mine');
  const wrap = document.getElementById('clientJobs');
  wrap.innerHTML = '';
  if (!myJobs.length) { wrap.innerHTML = `<div class="card">${i18n.t('myJobs.noPosted')}</div>`; return; }
  myJobs.forEach(j=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div><strong>${esc(j.title)}</strong> <span class="badge ${j.status==='open'?'status-open':(j.status==='assigned'?'status-assigned':'status-completed')}">${j.status}</span></div>
        <div class="small">Apps: ${j.applicationsCount || 0}</div>
      </div>
      <div class="small">Budget: ৳${j.budget} • ${esc(j.location?.address || '')}</div>
      <div style="margin-top:8px;">
        <button class="btn outline" data-act="viewApps" data-id="${j.id}">${i18n.t('myJobs.viewApps')}</button>
        ${j.assignedTo ? `<button class="btn" data-act="chat" data-id="${j.id}">${i18n.t('myJobs.openChat')}</button>` : ''}
        ${j.assignedTo && j.status!=='completed' ? `<button class="btn success" data-act="complete" data-id="${j.id}">${i18n.t('myJobs.complete')}</button>` : ''}
      </div>
      <div class="applications" id="apps_${j.id}" style="margin-top:8px;"></div>
      <div class="completeBox" id="complete_${j.id}" style="display:none;margin-top:8px;"></div>
    `;
    wrap.appendChild(el);
  });

  wrap.onclick = async (e)=>{
    const btn = e.target.closest('button'); if (!btn) return;
    const jobId = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');

    if (act === 'viewApps') {
      const box = document.getElementById(`apps_${jobId}`);
      if (box.getAttribute('data-loaded')==='1') { box.innerHTML=''; box.setAttribute('data-loaded','0'); return; }
      box.innerHTML = `<div class="small">${i18n.t('common.loading')}</div>`;
      try {
        const { applications } = await $api(`/api/jobs/${jobId}/applications`);
        if (!applications.length) { box.innerHTML = `<div class="small">${i18n.t('myJobs.noApplications')}</div>`; return; }
        box.innerHTML = '';
        applications.forEach(a=>{
          const d = document.createElement('div');
          d.className = 'item';
          d.innerHTML = `
            <div>
              <div><strong>${esc(a.worker?.name || 'Worker')}</strong> <span class="badge">${(a.worker?.rating||0).toFixed(1)}★</span></div>
              <div class="small">${esc(a.note || '')}</div>
            </div>
            <div>
              ${a.status==='pending' ? `<button class="btn" data-act="assign" data-job="${jobId}" data-worker="${a.workerId}">${i18n.t('myJobs.assign')}</button>` : `<span class="badge">${a.status}</span>`}
            </div>
          `;
          box.appendChild(d);
        });
        box.setAttribute('data-loaded','1');
      } catch(ex){ box.innerHTML = `<div class="small" style="color:#dc2626;">${ex.message}</div>`; }
    }

    if (act === 'assign') {
      const jobIdToAssign = btn.getAttribute('data-job');
      const workerId = btn.getAttribute('data-worker');
      if (!confirm(i18n.t('myJobs.assignConfirm'))) return;
      try {
        await $api(`/api/jobs/${jobIdToAssign}/assign`, { method:'PUT', body:{ workerId } });
        alert(i18n.t('myJobs.assigned'));
        await loadClientView();
      } catch(ex){ alert(ex.message); }
    }

    if (act === 'chat') { openChat(jobId); }

    if (act === 'complete') {
      const box = document.getElementById(`complete_${jobId}`);
      box.style.display = box.style.display==='none' ? 'block' : 'none';
      if (box.innerHTML) return;
      const ratingWrap = document.createElement('div');
      const r = ratingWidget(ratingWrap);
      const txt = document.createElement('textarea');
      txt.className = 'input'; txt.placeholder = i18n.t('myJobs.reviewPlaceholder');
      const submit = document.createElement('button');
      submit.className = 'btn success'; submit.textContent = i18n.t('myJobs.complete');
      submit.onclick = async ()=>{
        try {
          await $api(`/api/jobs/${jobId}/complete`, { method:'POST', body:{ rating: r.value, comment: txt.value.trim() } });
          alert(i18n.t('myJobs.completed')); await loadClientView();
        } catch(ex){ alert(ex.message); }
      };
      box.appendChild(ratingWrap);
      box.appendChild(txt);
      box.appendChild(submit);
    }
  };
}

async function loadWorkerView() {
  const { assignedJobs, appliedJobs } = await $api('/api/jobs/mine');
  const assigned = document.getElementById('workerAssigned');
  const applied = document.getElementById('workerApplied');
  assigned.innerHTML = '';
  applied.innerHTML = '';

  if (!assignedJobs.length) assigned.innerHTML = `<div class="card">${i18n.t('common.noData')}</div>`;
  assignedJobs.forEach(j=>{
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div>
        <div><strong>${esc(j.title)}</strong> <span class="badge ${j.status==='completed'?'status-completed':'status-assigned'}">${j.status}</span></div>
        <div class="small">Budget: ৳${j.budget} • ${esc(j.location?.address || '')}</div>
      </div>
      <div>
        <button class="btn" data-act="chat" data-id="${j.id}">${i18n.t('myJobs.openChat')}</button>
      </div>
    `;
    assigned.appendChild(el);
  });

  if (!appliedJobs.length) applied.innerHTML = `<div class="card">${i18n.t('myJobs.noApplications')}</div>`;
  appliedJobs.forEach(j=>{
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div>
        <div><strong>${esc(j.title)}</strong></div>
        <div class="small">Status: <span class="badge">${esc(j.myApplication?.status || 'pending')}</span></div>
      </div>
      <div>
        <button class="btn outline" data-act="chat" data-id="${j.id}">${i18n.t('myJobs.openChat')}</button>
      </div>
    `;
    applied.appendChild(el);
  });

  document.getElementById('app').onclick = async (e)=>{
    const btn = e.target.closest('button'); if (!btn) return;
    const jobId = btn.getAttribute('data-id');
    if (btn.getAttribute('data-act') === 'chat') openChat(jobId);
  };
}

(async ()=>{
  me = await $auth.requireAuth();
  if (!me) return;
  i18n.apply(document);
  if (me.role === 'client') {
    document.getElementById('clientSection').style.display = 'block';
    await loadClientView();
  } else {
    document.getElementById('workerSection').style.display = 'block';
    await loadWorkerView();
  }
})();