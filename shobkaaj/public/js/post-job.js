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
(async ()=>{
  const me = await $auth.requireAuth(['client']);
  if (!me) return;

  const locLabel = document.getElementById('locLabel');
  if (me.location && me.location.address) {
    locLabel.textContent = me.location.address;
    locationData = me.location;
  } else if (me.location && me.location.lat && me.location.lng) {
    const address = await reverseGeocode(me.location.lat, me.location.lng);
    locLabel.textContent = address;
    locationData = { ...me.location, address: address };
  } else {
    locLabel.textContent = 'N/A';
  }

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
        alert(i18n.t('common.locationDenied') + ': Could not determine your location.');
        locLabel.textContent = 'N/A';
        return;
      }
    }
    locationData = { lat, lng, address };
    locLabel.textContent = address;
  };

  document.getElementById('jobForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = {
      title: e.target.title.value.trim(),
      description: e.target.description.value.trim(),
      budget: Number(e.target.budget.value || 0),
      deadline: e.target.deadline.value,
      location: locationData
    };
    const err = document.getElementById('err');
    err.textContent = '';
    try {
      await $api('/api/jobs', { method:'POST', body });
      alert('Job posted!');
      window.location.href = '/my-jobs.html';
    } catch(ex) { err.textContent = ex.message; }
  });
})();