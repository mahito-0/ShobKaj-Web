let me = null;

// Helper functions
function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('profileContent').style.display = 'none';
  document.getElementById('accessDenied').style.display = 'none';
}

function showProfile() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('profileContent').style.display = 'block';
  document.getElementById('accessDenied').style.display = 'none';
}

function showAccessDenied() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('profileContent').style.display = 'none';
  document.getElementById('accessDenied').style.display = 'block';
}

function showError(message) {
  const errorContainer = document.getElementById('errorContainer');
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorContainer.classList.remove('hidden');
  document.getElementById('successContainer').classList.add('hidden');
  // Scroll error into view
  errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess(message = 'Profile updated successfully!') {
  const successContainer = document.getElementById('successContainer');
  const successMessage = document.getElementById('successMessage');
  successMessage.textContent = message;
  successContainer.classList.remove('hidden');
  document.getElementById('errorContainer').classList.add('hidden');
  // Scroll success into view
  successContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessages() {
  document.getElementById('errorContainer').classList.add('hidden');
  document.getElementById('successContainer').classList.add('hidden');
}

(async ()=>{
  console.log('[Profile] Starting profile initialization...');
  console.log('[Profile] Available globals:', {
    '$api': typeof window.$api,
    '$auth': typeof window.$auth,
    'mockAuthStatus': window.__mockAuthStatus,
    'userId': localStorage.getItem('userId')
  });
  
  try {
    showLoading();
    
    // Check if we're in development mode with fallback
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         localStorage.getItem('useMockAuth') === 'true';
    
    console.log('[Profile] Development mode:', isDevelopment);
    console.log('[Profile] Attempting authentication...');
    
    // Try to get authenticated user
    try {
      me = await $auth.requireAuth();
      console.log('[Profile] Authentication successful:', me ? 'User found' : 'No user');
    } catch (authError) {
      console.error('[Profile] Authentication error:', authError);
      
      // Fallback for development mode
      if (isDevelopment) {
        console.log('[Profile] Using development fallback authentication');
        try {
          // Try to get user data directly from API
          const response = await $api('/api/me');
          me = response.user;
          console.log('[Profile] Fallback authentication successful:', me);
        } catch (fallbackError) {
          console.error('[Profile] Fallback authentication failed:', fallbackError);
          // Use mock user if available
          if (window.__mockUser) {
            me = window.__mockUser;
            console.log('[Profile] Using mock user from global:', me);
          }
        }
      }
    }
    
    if (!me) {
      console.log('[Profile] No user found, showing access denied');
      showAccessDenied();
      return;
    }
    
    console.log('[Profile] User authenticated successfully:', { 
      id: me.id, 
      name: me.name, 
      hasLocation: !!(me.location?.lat && me.location?.lng) 
    });
    
    showProfile();
    i18n.apply(document);

    // Populate form with user data
    console.log('[Profile] Populating form with user data...');
    const form = document.getElementById('profileForm');
    form.name.value = me.name || '';
    form.phone.value = me.phone || '';
    form.nid.value = me.nid || '';
    form.skills.value = (me.skills || []).join(', ');
    form.bio.value = me.bio || '';
    
    // Update location display
    const locLabel = document.getElementById('locLabel');
    if (me.location && me.location.lat && me.location.lng) {
      locLabel.textContent = `Lat ${me.location.lat.toFixed(4)}, Lng ${me.location.lng.toFixed(4)}`;
      locLabel.className = 'badge success';
      form.dataset.lat = me.location.lat;
      form.dataset.lng = me.location.lng;
    } else {
      locLabel.textContent = 'Location not set';
      locLabel.className = 'badge';
    }
    
    // Update avatar
    const avatarImg = document.getElementById('avatarImg');
    if (me.avatar && me.avatar !== '/img/avatar.png') {
      avatarImg.src = me.avatar;
    } else {
      avatarImg.src = '/img/avatar.png';
    }

    // Location button handler
    const locBtn = document.getElementById('locBtn');
    locBtn.setAttribute('data-i18n','common.useMyLocation');
    i18n.apply(document);
    
    locBtn.onclick = () => {
      if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.');
        return;
      }
      
      // Show loading state
      locBtn.disabled = true;
      locBtn.innerHTML = '<span class="spinner"></span><span>Getting location...</span>';
      
      navigator.geolocation.getCurrentPosition(
        pos => {
          form.dataset.lat = pos.coords.latitude;
          form.dataset.lng = pos.coords.longitude;
          locLabel.textContent = `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`;
          locLabel.className = 'badge success';
          
          // Reset button
          locBtn.disabled = false;
          locBtn.innerHTML = '<span>📏</span><span>Use my location</span>';
          
          showSuccess('Location updated successfully!');
          setTimeout(() => hideMessages(), 3000);
        },
        err => {
          console.error('Geolocation error:', err);
          let errorMsg = 'Unable to get your location. ';
          switch(err.code) {
            case err.PERMISSION_DENIED:
              errorMsg += 'Please enable location permissions.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg += 'Location information is unavailable.';
              break;
            case err.TIMEOUT:
              errorMsg += 'Location request timed out.';
              break;
            default:
              errorMsg += 'Please try again.';
              break;
          }
          showError(errorMsg);
          
          // Reset button
          locBtn.disabled = false;
          locBtn.innerHTML = '<span>📏</span><span>Use my location</span>';
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    };

    // Form submission handler
    console.log('[Profile] Setting up form submission handler');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('[Profile] Form submitted');
      hideMessages();
      
      // Validate required fields
      if (!form.name.value.trim()) {
        console.log('[Profile] Validation failed: Name is required');
        showError('Name is required.');
        form.name.focus();
        return;
      }
      
      // Prepare data
      const body = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        nid: form.nid.value.trim(),
        skills: form.skills.value.split(',').map(s => s.trim()).filter(Boolean),
        bio: form.bio.value.trim()
      };
      
      // Add location if available
      if (form.dataset.lat && form.dataset.lng) {
        body.location = { 
          lat: Number(form.dataset.lat), 
          lng: Number(form.dataset.lng), 
          address: 'Updated via Profile' 
        };
      }
      
      // Show loading state
      const saveBtn = document.getElementById('saveBtn');
      const originalText = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span><span>Saving...</span>';
      
      try {
        console.log('[Profile] Sending API request to update profile:', body);
        const response = await $api('/api/me', { method: 'PUT', body });
        console.log('[Profile] Profile update response:', response);
        
        showSuccess('Profile updated successfully!');
        
        // Reset button
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
        
        // Update local user data
        me = { ...me, ...body };
        console.log('[Profile] Local user data updated:', me);
        
      } catch (ex) {
        console.error('[Profile] Profile update error:', ex);
        showError(ex.message || 'Failed to update profile. Please try again.');
        
        // Reset button
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    });

    // Avatar upload handler
    const avatarInput = document.getElementById('avatarInput');
    avatarInput.addEventListener('change', async () => {
      const file = avatarInput.files[0];
      if (!file) return;
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        showError('File size must be less than 2MB.');
        avatarInput.value = '';
        return;
      }
      
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showError('Please select a PNG, JPG, or WebP image.');
        avatarInput.value = '';
        return;
      }
      
      hideMessages();
      const avatarImg = document.getElementById('avatarImg');
      const originalSrc = avatarImg.src;
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
      
      try {
        const fd = new FormData();
        fd.append('avatar', file);
        const res = await $api('/api/me/avatar', { method: 'POST', formData: fd });
        
        // Update with server response
        avatarImg.src = res.avatar || '/img/avatar.png';
        me.avatar = res.avatar;
        showSuccess('Profile picture updated successfully!');
        setTimeout(() => hideMessages(), 3000);
        
      } catch (e) {
        console.error('Avatar upload error:', e);
        // Restore original image on error
        avatarImg.src = originalSrc;
        showError(e.message || 'Failed to update profile picture. Please try again.');
      }
      
      // Clear input
      avatarInput.value = '';
    });
    
  } catch (error) {
    console.error('[Profile] Profile initialization error:', error);
    console.log('[Profile] Error stack:', error.stack);
    
    // Enhanced error diagnostics
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         localStorage.getItem('useMockAuth') === 'true';
    
    if (isDevelopment) {
      console.log('[Profile] Development mode error diagnostics:');
      console.log('- Mock auth status:', window.__mockAuthStatus);
      console.log('- $api function:', typeof window.$api);
      console.log('- $auth function:', typeof window.$auth);
      console.log('- userId in localStorage:', localStorage.getItem('userId'));
      
      // In development, try to show profile anyway with mock data
      if (window.__mockUser) {
        console.log('[Profile] Emergency fallback: using mock user');
        me = window.__mockUser;
        showProfile();
        
        // Populate form with mock data
        const form = document.getElementById('profileForm');
        form.name.value = me.name || '';
        form.phone.value = me.phone || '';
        form.nid.value = me.nid || '';
        form.skills.value = (me.skills || []).join(', ');
        form.bio.value = me.bio || '';
        
        return; // Exit early with mock data
      }
    }
    
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.log('[Profile] Authentication error, showing access denied');
      showAccessDenied();
    } else {
      console.log('[Profile] General error, showing access denied with message');
      showAccessDenied();
      // Show error message in access denied view
      const accessDenied = document.getElementById('accessDenied');
      const errorP = accessDenied.querySelector('p');
      if (errorP) {
        errorP.textContent = `Error loading profile: ${error.message}`;
      }
    }
  }
})();
