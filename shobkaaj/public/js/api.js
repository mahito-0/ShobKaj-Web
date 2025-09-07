async function api(path, { method = 'GET', body, formData } = {}) {
  const options = {
    method,
    headers: formData ? undefined : { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: formData ? formData : (body ? JSON.stringify(body) : undefined)
  };
  const res = await fetch(path, options);
  if (!res.ok) {
    let data; try { data = await res.json(); } catch (e) {}
    throw new Error(data?.error || ('HTTP ' + res.status));
  }
  return res.json();
}
window.$api = api;