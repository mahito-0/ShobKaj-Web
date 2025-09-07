async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = formData ? {} : { 'Content-Type': 'application/json' };

  // Temporary: Get user ID from local storage. This will be replaced with a proper auth system.
  const userId = localStorage.getItem('userId');
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const options = {
    method,
    headers,
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