async function getMe() {
  try {
    const { user } = await $api('/api/me');
    return user;
  } catch (e) {
    // If unauthorized or API not reachable, treat as logged-out
    return null;
  }
}
async function requireAuth(roles = null) {
  const me = await getMe();
  if (!me) { window.location.href = '/login.html'; return null; }
  if (roles && !roles.includes(me.role)) { window.location.href = '/dashboard.html'; return null; }
  return me;
}
async function logout() {
  localStorage.removeItem('userId');
  try { await $api('/api/logout', { method:'POST' }); } catch(e) {}
  window.location.href = '/';
}
window.$auth = { getMe, requireAuth, logout };