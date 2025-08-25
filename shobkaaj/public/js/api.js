async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let data; try { data = await res.json(); } catch (e) {}
    throw new Error(data?.error || ('HTTP ' + res.status));
  }
  return res.json();
}
window.$api = api;