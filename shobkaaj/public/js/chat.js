let me = null, socket = null, currentConv = null, messages = [];
function fmt(ts){ const d=new Date(ts); return d.toLocaleString(); }
function esc(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

async function fetchJobTitle(jobId) { try { const { job } = await $api(`/api/jobs/${jobId}`); return job?.title || ''; } catch { return ''; } }

function renderConversations(list) {
  const el = document.getElementById('convList');
  el.innerHTML = ''; // Clear existing content

  const startDiv = document.createElement('div');
  startDiv.className = 'card'; startDiv.style.margin='12px';
  startDiv.innerHTML = `
    <h4 data-i18n="chat.startNew">${i18n.t('chat.startNew')}</h4>
    <input class="input" id="otherId" data-i18n-placeholder="chat.enterUserId" placeholder="${i18n.t('chat.enterUserId')}"/>
    <button class="btn" id="startBtn" data-i18n="chat.send">${i18n.t('chat.send')}</button>
    <div class="small">Admin can see user IDs.</div>
  `;
  i18n.apply(startDiv);
  el.appendChild(startDiv); // Append startDiv first

  const conversationsHeader = document.createElement('div');
  conversationsHeader.style.padding = '12px';
  conversationsHeader.style.fontWeight = '600';
  conversationsHeader.setAttribute('data-i18n', 'chat.conversations');
  conversationsHeader.textContent = i18n.t('chat.conversations');
  el.appendChild(conversationsHeader); // Append header after startDiv

  list.forEach(c => {
    const last = c.lastMessage ? ` • ${esc(c.lastMessage.text.slice(0,30))}` : '';
    const otherName = esc(c.other?.name || 'User');
    const avatar = c.other?.avatar || '/img/avater.png';
    const jobBadge = c.jobId ? ` <span class="badge">Job</span>` : '';
    const div = document.createElement('div');
    div.className = 'conv' + (currentConv?.id===c.id ? ' active' : '');
    div.innerHTML = `<img class="avatar" src="${avatar}" onerror="this.src='/img/avater.png'"/><div><strong>${otherName}</strong>${jobBadge}<div class="small">${last}</div></div>`;
    div.onclick = () => openConversation(c);
    el.appendChild(div); // Append each conversation item
  });

  document.getElementById('startBtn').onclick = async () => {
    const otherUserId = document.getElementById('otherId').value.trim();
    if (!otherUserId) return;
    try {
      const { conversation } = await $api('/api/conversations', { method:'POST', body:{ otherUserId }});
      await loadConversations(conversation.id);
    } catch(e){ alert(e.message); }
  };
}

function renderMessages() {
  const mEl = document.getElementById('msgs');
  mEl.innerHTML = '';
  messages.forEach(m => {
    const div = document.createElement('div');
    div.className = 'message' + (m.from === me.id ? ' me' : '');
    div.innerHTML = `<div>${esc(m.text)}</div><div class="msg-meta">${fmt(m.createdAt)}</div>`;
    mEl.appendChild(div);
  });
  mEl.scrollTop = mEl.scrollHeight;
}

async function openConversation(conv) {
  currentConv = conv;
  let head = `${esc(conv.other?.name || 'User')}`;
  if (conv.jobId) {
    const title = await fetchJobTitle(conv.jobId);
    head += ` • <span class="badge">Job: ${esc(title.slice(0,20))}</span>`;
  }
  const avatar = conv.other?.avatar || '/img/avater.png';
  document.getElementById('activeHeader').innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><img class="avatar" src="${avatar}" onerror="this.src='/img/avater.png'"/> <strong>${head}</strong> <span class="badge">Conv: ${conv.id.slice(0,8)}</span></span>`;
  const data = await $api(`/api/conversations/${conv.id}/messages`);
  messages = data.messages;
  renderMessages();
  socket.emit('join-room', conv.id);
}

async function loadConversations(openConvId=null) {
  const { conversations } = await $api('/api/conversations');
  renderConversations(conversations);
  if (openConvId) {
    const c = conversations.find(x => x.id === openConvId);
    if (c) openConversation(c);
  } else if (conversations.length && !currentConv) {
    openConversation(conversations[0]);
  }
}

(async ()=>{
  me = await $auth.requireAuth();
  if (!me) return;
  i18n.apply(document);

  socket = io({ withCredentials: true });
  socket.on('new-message', ({ message }) => {
    if (currentConv && message.conversationId === currentConv.id) {
      messages.push(message); renderMessages();
    }
  });
  socket.on('typing', ({ isTyping }) => {
    const el = document.getElementById('typing');
    el.textContent = isTyping ? i18n.t('chat.typing') : '';
  });

  let openConvId = sessionStorage.getItem('openConv');
  sessionStorage.removeItem('openConv');
  await loadConversations(openConvId || null);

  const input = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');
  document.getElementById('activeHeader').setAttribute('data-i18n','chat.select');
  document.getElementById('activeHeader').textContent = i18n.t('chat.select');
  sendBtn.textContent = i18n.t('chat.send');

  sendBtn.onclick = ()=>{
    if (!currentConv) return alert(i18n.t('chat.select'));
    const text = input.value.trim();
    if (!text) return;
    socket.emit('send-message', { conversationId: currentConv.id, text });
    input.value = '';
  };
  let typingTimeout=null;
  input.addEventListener('input', ()=>{
    if (!currentConv) return;
    socket.emit('typing', { conversationId: currentConv.id, isTyping: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(()=> socket.emit('typing', { conversationId: currentConv.id, isTyping: false }), 800);
  });
})();