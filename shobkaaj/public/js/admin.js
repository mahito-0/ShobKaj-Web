let me=null, socket=null;

function row(html){ const tr=document.createElement('tr'); tr.innerHTML = html; return tr; }
function esc(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

async function loadUsers() {
  const { users } = await $api('/api/users');
  const tbody = document.querySelector('#usersTbl tbody');
  tbody.innerHTML = '';
  users.forEach(u=>{
    const tr = row(`
      <td>${esc(u.name)}</td>
      <td>${esc(u.email)}</td>
      <td>${u.role}</td>
      <td>${u.verified ? 'Yes' : 'No'}</td>
      <td>${u.banned ? 'Yes' : 'No'}</td>
      <td><code>${u.id}</code></td>
      <td>
        <button class="btn ${u.verified?'outline':'success'}" data-act="verify" data-id="${u.id}">${u.verified?'Unverify':'Verify'}</button>
        <button class="btn ${u.banned?'success':'danger'}" data-act="ban" data-id="${u.id}">${u.banned?'Unban':'Ban'}</button>
      </td>
    `);
    tbody.appendChild(tr);
  });
  tbody.onclick = async (e)=>{
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    try {
      if (act === 'verify') await $api(`/api/users/${id}`, { method:'PATCH', body:{ verified: btn.textContent==='Verify' }});
      if (act === 'ban') await $api(`/api/users/${id}`, { method:'PATCH', body:{ banned: btn.textContent==='Ban' }});
      await loadUsers();
    } catch(ex){ alert(ex.message); }
  };
}

async function loadConvs() {
  const { conversations } = await $api('/api/admin/conversations');
  const wrap = document.getElementById('convs');
  wrap.innerHTML = '';
  conversations.forEach(c=>{
    const last = c.lastMessage ? ` • ${esc(c.lastMessage.text.slice(0,40))}` : '';
    const pnames = c.participantsInfo.map(p=> esc(p?.name||p?.id)).join(', ');
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div>
        <div><strong>${pnames}</strong></div>
        <div class="small">Conv: ${c.id.slice(0,8)} ${last}</div>
      </div>
      <div><span class="badge">job: ${c.jobId || 'N/A'}</span></div>
    `;
    wrap.appendChild(div);
  });
}

async function loadJobs() {
  const { jobs } = await $api('/api/admin/jobs');
  const tbody = document.querySelector('#jobsTbl tbody');
  tbody.innerHTML = '';
  jobs.forEach(j=>{
    const tr = row(`
      <td>${esc(j.title)}</td>
      <td>${j.status}</td>
      <td>৳${j.budget}</td>
      <td>${esc(j.client?.name || '')}</td>
      <td>${esc(j.worker?.name || '')}</td>
      <td><code>${j.id.slice(0,8)}</code></td>
    `);
    tbody.appendChild(tr);
  });
}

function initMonitor() {
  const mon = document.getElementById('monitor');
  const presence = document.getElementById('presence');
  socket = io({ withCredentials:true });
  socket.on('connect', ()=> socket.emit('admin-watch'));
  socket.on('monitor-message', ({ message, conversationId })=>{
    const div = document.createElement('div');
    div.innerHTML = `<strong>${conversationId.slice(0,8)}</strong> [${new Date(message.createdAt).toLocaleTimeString()}] <code>${message.from}</code>: ${esc(message.text)}`;
    mon.appendChild(div);
    mon.scrollTop = mon.scrollHeight;
  });
  const pres = new Map();
  function renderPresence() {
    presence.innerHTML = '';
    const list = [...pres.entries()].map(([uid, cnt]) => ({ uid, cnt })).sort((a,b)=>b.cnt-a.cnt);
    list.forEach(({uid,cnt})=>{
      const d = document.createElement('div');
      d.className='item';
      d.innerHTML = `<div><code>${uid}</code></div><div>${cnt>0?'<span class="badge">online</span>':'offline'}</div>`;
      presence.appendChild(d);
    });
  }
  socket.on('presence-snapshot', (snap)=>{ pres.clear(); snap.forEach(s=> pres.set(s.userId, s.count)); renderPresence(); });
  socket.on('presence', ({ userId, count })=>{ pres.set(userId, count); renderPresence(); });
}

(async ()=>{
  me = await $auth.requireAuth(['admin']);
  if (!me) return;
  i18n.apply(document);
  await loadUsers();
  await loadConvs();
  await loadJobs();
  initMonitor();
})();