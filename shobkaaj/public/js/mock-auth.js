// Mock authentication system for testing with enhanced debugging
(() => {
  console.log('[MockAuth] Initializing mock authentication system...');
  
  // Check if we should use mock auth (for development)
  const useMockAuth = localStorage.getItem('useMockAuth') === 'true' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

  // Expose mock auth status globally for debugging
  window.__mockAuthStatus = { enabled: useMockAuth, loaded: false, overrideApplied: false };
  
  if (!useMockAuth) {
    console.log('[MockAuth] Mock authentication is disabled. Set localStorage.useMockAuth="true" to enable.');
    return;
  }

  console.log('[MockAuth] Mock authentication is enabled for development');
  
  // Mock user data with enhanced debugging
  const mockUser = {
    id: 'user_123',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+8801234567890',
    role: 'client',
    nid: '1234567890123',
    skills: ['tutoring', 'delivery'],
    bio: 'This is a test user account for development purposes.',
    avatar: '/img/avatar.png',
    location: {
      lat: 23.8103,
      lng: 90.4125,
      address: 'Dhaka, Bangladesh'
    },
    createdAt: new Date().toISOString()
  };
  
  console.log('[MockAuth] Mock user data created:', mockUser);

  // Store the original API function for fallback
  const originalApi = window.$api;
  console.log('[MockAuth] Original $api function:', originalApi ? 'Found' : 'Not found yet');
  
  // Create enhanced mock API with comprehensive logging
  const mockApi = async (path, options = {}) => {
    console.log(`[MockAuth] API call intercepted: ${options.method || 'GET'} ${path}`, options);
    
    // Simulate realistic network delay
    const delay = Math.random() * 300 + 100;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Handle different API endpoints with detailed logging
    if (path === '/api/me') {
      if (options.method === 'PUT') {
        console.log('[MockAuth] Updating user profile with:', options.body);
        // Update mock user data
        Object.assign(mockUser, options.body);
        const response = { user: mockUser, success: true };
        console.log('[MockAuth] Profile update response:', response);
        return response;
      }
      console.log('[MockAuth] Returning mock user data');
      return { user: mockUser };
    }

    if (path === '/api/me/avatar' && options.method === 'POST') {
      console.log('[MockAuth] Mock avatar upload');
      // Mock avatar upload
      const timestamp = Date.now();
      mockUser.avatar = `/uploads/avatar_${timestamp}.jpg`;
      const response = { avatar: mockUser.avatar, success: true };
      console.log('[MockAuth] Avatar upload response:', response);
      return response;
    }

    if (path === '/api/logout' && options.method === 'POST') {
      console.log('[MockAuth] Mock logout');
      return { success: true };
    }

    // For other endpoints, try the original API or return mock data
    console.log('[MockAuth] Attempting to use original API for:', path);
    try {
      if (originalApi && typeof originalApi === 'function') {
        return await originalApi(path, options);
      }
      throw new Error('Original API not available');
    } catch (error) {
      console.warn(`[MockAuth] Original API failed for ${path}, returning mock success:`, error.message);
      return { success: true, data: null };
    }
  };
  
  // Override the global API function
  window.$api = mockApi;
  window.__mockAuthStatus.overrideApplied = true;
  window.__mockAuthStatus.loaded = true;
  console.log('[MockAuth] API override applied successfully');

  // Set user ID in localStorage for compatibility
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', mockUser.id);
    console.log('[MockAuth] User ID set in localStorage:', mockUser.id);
  } else {
    console.log('[MockAuth] User ID already exists in localStorage:', localStorage.getItem('userId'));
  }

  // Enhanced debugging utilities
  window.toggleMockAuth = () => {
    const current = localStorage.getItem('useMockAuth') === 'true';
    localStorage.setItem('useMockAuth', (!current).toString());
    console.log(`[MockAuth] Mock auth ${!current ? 'enabled' : 'disabled'}. Reload the page to apply changes.`);
  };
  
  window.debugMockAuth = () => {
    console.log('[MockAuth] Debug Information:');
    console.log('- Status:', window.__mockAuthStatus);
    console.log('- Current user:', mockUser);
    console.log('- API function type:', typeof window.$api);
    console.log('- User ID in localStorage:', localStorage.getItem('userId'));
    console.log('- Mock auth setting:', localStorage.getItem('useMockAuth'));
    console.log('- Current hostname:', window.location.hostname);
  };
  
  window.resetMockAuth = () => {
    localStorage.setItem('useMockAuth', 'true');
    localStorage.setItem('userId', mockUser.id);
    console.log('[MockAuth] Mock auth reset. Reload the page.');
  };

  // Enable mock auth by default for development
  if (!localStorage.getItem('useMockAuth')) {
    localStorage.setItem('useMockAuth', 'true');
    console.log('[MockAuth] Mock auth enabled by default for development');
  }

  // Final status messages
  console.log('[MockAuth] ✅ Mock authentication system loaded successfully!');
  console.log('[MockAuth] Available debug commands: debugMockAuth(), toggleMockAuth(), resetMockAuth()');
  
  // Expose mock user for debugging
  window.__mockUser = mockUser;
})();
