// Helper for fetch with timeout
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try { const res = await fetch(resource, { ...options, signal: controller.signal }); clearTimeout(id); return res; }
  catch (err) { clearTimeout(id); throw err; }
}

// Get location via Geolocation API
function getLocationViaGeolocation(timeout = 10000){
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 600000, timeout });
  });
}

// Get location via IP address
async function getLocationViaIP(){
  const providers = ['https://ipapi.co/json/','https://ipwho.is/','https://ipinfo.io/json'];
  for (const url of providers){
    try {
      const res = await fetchWithTimeout(url, { timeout: 7000 });
      if (!res.ok) continue;
      const j = await res.json();
      const lat = Number(j.latitude ?? j.lat ?? (j.loc && j.loc.split(',') && j.loc.split(',')[0]));
      const lon = Number(j.longitude ?? j.lon ?? (j.loc && j.loc.split(',') && j.loc.split(',')[1]));
      const place = j.city ? `${j.city}${j.region ? ', ' + j.region : ''}${(j.country_name || j.country) ? ', ' + (j.country_name || j.country) : ''}` : '';
      if (isFinite(lat) && isFinite(lon)) return { latitude: lat, longitude: lon, place };
    } catch {} // Ignore errors and try next provider
  }
  throw new Error('All IP location providers failed');
}

// Geocode place name to coordinates
async function geocodePlace(query){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en`;
  const res = await fetchWithTimeout(url, { timeout: 8000 });
  if (!res.ok) throw new Error('Geocoding failed');
  const j = await res.json();
  if (!j?.results?.length) throw new Error('No results');
  const r = j.results[0];
  return { latitude: r.latitude, longitude: r.longitude, name: (r.name + (r.country ? ', ' + r.country : '')) };
}

// Reverse geocode coordinates to place name
async function reverseGeocode(lat, lng) {
  // Using Open-Meteo's geocoding API for reverse geocoding
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lng}&count=1&language=en`;
  try {
    const res = await fetchWithTimeout(url, { timeout: 8000 });
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const j = await res.json();
    if (!j?.results?.length) return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`; // Fallback to coords if no place found
    const r = j.results[0];
    // Construct a human-readable address from available fields
    const parts = [];
    if (r.name) parts.push(r.name);
    if (r.admin1) parts.push(r.admin1); // State/Province
    if (r.country) parts.push(r.country);
    return parts.join(', ') || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`; // Fallback on error
  }
}

i18n.apply(document);
let locationData = null;
document.getElementById('locBtn').onclick = async () => {
  let lat, lng, address;
  try {
    const pos = await getLocationViaGeolocation();
    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
    address = await reverseGeocode(lat, lng);
  } catch (geoError) {
    console.warn('Geolocation failed, trying IP-based location:', geoError);
    try {
      const ipLoc = await getLocationViaIP();
      lat = ipLoc.latitude;
      lng = ipLoc.longitude;
      address = ipLoc.place || await reverseGeocode(lat, lng); // Use IP place if available, else reverse geocode
    } catch (ipError) {
      console.error('IP-based location also failed:', ipError);
      alert('Location permission denied: Could not determine your location.');
      document.getElementById('locLabel').textContent = 'N/A';
      return;
    }
  }
  locationData = { lat, lng, address };
  document.getElementById('locLabel').textContent = address;
};
document.getElementById('regForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const body = {
    name: e.target.name.value.trim(),
    email: e.target.email.value.trim(),
    password: e.target.password.value,
    role: e.target.role.value,
    phone: e.target.phone.value.trim(),
    nid: e.target.nid.value.trim(),
    skills: e.target.skills.value.split(',').map(s => s.trim()).filter(Boolean),
    location: locationData
  };
  const err = document.getElementById('err');
  err.textContent = '';
  try {
    await $api('/api/register', { method:'POST', body });
    window.location.href = '/dashboard.html';
  } catch (ex) { err.textContent = ex.message; }
});