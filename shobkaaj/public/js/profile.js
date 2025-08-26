let me = null;
(async ()=>{
  me = await $auth.requireAuth();
  if (!me) return;
  i18n.apply(document);

  const form = document.getElementById('profileForm');
  form.name.value = me.name || '';
  form.phone.value = me.phone || '';
  form.nid.value = me.nid || '';
  form.skills.value = (me.skills || []).join(', ');
  form.bio.value = me.bio || '';
  const locLabel = document.getElementById('locLabel');
  locLabel.textContent = me.location ? `Lat ${me.location.lat.toFixed(4)}, Lng ${me.location.lng.toFixed(4)}` : 'N/A';
  const avatarImg = document.getElementById('avatarImg');
  avatarImg.src = me.avatar || '/img/avatar.png';

  document.getElementById('locBtn').onclick = ()=>{
    navigator.geolocation?.getCurrentPosition(
      pos => {
        form.dataset.lat = pos.coords.latitude;
        form.dataset.lng = pos.coords.longitude;
        locLabel.textContent = `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`;
      },
      err => alert('Location permission denied')
    );
  };

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      nid: form.nid.value.trim(),
      skills: form.skills.value.split(',').map(s => s.trim()).filter(Boolean),
      bio: form.bio.value.trim()
    };
    if (form.dataset.lat && form.dataset.lng) {
      body.location = { lat: Number(form.dataset.lat), lng: Number(form.dataset.lng), address: 'Updated via Profile' };
    }
    const err = document.getElementById('err');
    err.textContent = '';
    try {
      await $api('/api/me', { method:'PUT', body });
      alert('Profile updated');
      window.location.reload();
    } catch(ex){ err.textContent = ex.message; }
  });

  // Avatar upload
  const avatarInput = document.getElementById('avatarInput');
  avatarInput.addEventListener('change', async ()=>{
    const file = avatarInput.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await $api('/api/me/avatar', { method: 'POST', formData: fd });
      document.getElementById('avatarImg').src = res.avatar || '/img/avatar.png';
      alert('Profile picture updated.');
    } catch (e) { alert(e.message); }
  });
})();