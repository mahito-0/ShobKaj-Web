// Debug utility functions for ShobKaaj development
(() => {
  console.log('[DebugUtils] Loading debug utilities...');

  // Global debug object
  window.__debug = {
    // Check authentication status
    checkAuth: async () => {
      console.log('=== Authentication Debug ===');
      console.log('Mock auth status:', window.__mockAuthStatus || 'Not available');
      console.log('$api function type:', typeof window.$api);
      console.log('$auth function type:', typeof window.$auth);
      console.log('User ID in localStorage:', localStorage.getItem('userId'));
      console.log('Mock auth setting:', localStorage.getItem('useMockAuth'));
      
      try {
        const user = await window.$auth.getMe();
        console.log('Current user:', user);
        return user;
      } catch (error) {
        console.error('Auth error:', error);
        return null;
      }
    },
    
    // Test API endpoints
    testApi: async () => {
      console.log('=== API Debug ===');
      try {
        const response = await window.$api('/api/me');
        console.log('API /api/me response:', response);
        return response;
      } catch (error) {
        console.error('API error:', error);
        return null;
      }
    },
    
    // Check navbar dropdown functionality
    checkDropdown: () => {
      console.log('=== Dropdown Debug ===');
      const userMenus = document.querySelectorAll('.user-menu');
      console.log('User menus found:', userMenus.length);
      
      userMenus.forEach((menu, index) => {
        const avatar = menu.querySelector('.avatar');
        const dropdown = menu.querySelector('.user-dropdown');
        console.log(`User menu ${index + 1}:`, {
          hasAvatar: !!avatar,
          hasDropdown: !!dropdown,
          isActive: menu.classList.contains('active'),
          avatarClickable: avatar ? avatar.style.cursor === 'pointer' || getComputedStyle(avatar).cursor === 'pointer' : false
        });
        
        if (avatar) {
          avatar.style.border = '2px solid red'; // Temporary visual indicator
          setTimeout(() => {
            avatar.style.border = '';
          }, 3000);
        }
      });
    },
    
    // Force enable mock auth
    enableMockAuth: () => {
      localStorage.setItem('useMockAuth', 'true');
      localStorage.setItem('userId', 'user_123');
      console.log('Mock auth enabled. Reload the page to apply changes.');
    },
    
    // Test profile page access
    testProfileAccess: async () => {
      console.log('=== Profile Access Debug ===');
      
      try {
        // Test authentication
        const user = await this.checkAuth();
        if (!user) {
          console.log('❌ No authenticated user found');
          return false;
        }
        
        console.log('✅ User authenticated:', user.name || user.email);
        
        // Test if we can access profile page
        const currentPath = window.location.pathname;
        if (currentPath === '/profile.html') {
          console.log('✅ Already on profile page');
          
          // Check if profile content is visible
          const profileContent = document.getElementById('profileContent');
          const accessDenied = document.getElementById('accessDenied');
          const loading = document.getElementById('loading');
          
          console.log('Profile page state:', {
            profileContentVisible: profileContent ? profileContent.style.display !== 'none' : false,
            accessDeniedVisible: accessDenied ? accessDenied.style.display !== 'none' : false,
            loadingVisible: loading ? loading.style.display !== 'none' : false
          });
        } else {
          console.log('Navigate to /profile.html to test profile access');
        }
        
        return true;
      } catch (error) {
        console.error('❌ Profile access test failed:', error);
        return false;
      }
    },
    
    // Simulate clicking on dropdown
    simulateDropdownClick: () => {
      console.log('=== Simulating Dropdown Click ===');
      const avatar = document.querySelector('.user-menu .avatar');
      if (avatar) {
        console.log('Clicking avatar...');
        avatar.click();
        
        setTimeout(() => {
          const userMenu = avatar.closest('.user-menu');
          const isActive = userMenu.classList.contains('active');
          console.log('Dropdown active after click:', isActive);
          
          if (!isActive) {
            console.log('❌ Dropdown not activated. Checking event listeners...');
            console.log('Avatar element:', avatar);
            console.log('Avatar click listeners should be attached by main.js');
          } else {
            console.log('✅ Dropdown activated successfully!');
          }
        }, 100);
      } else {
        console.log('❌ Avatar not found. User probably not logged in.');
      }
    },
    
    // Get complete debug report
    getFullReport: async () => {
      console.log('=== COMPLETE DEBUG REPORT ===');
      const user = await this.checkAuth();
      this.testApi();
      this.checkDropdown();
      console.log('=== END REPORT ===');
      return {
        authenticated: !!user,
        user: user,
        mockAuthEnabled: localStorage.getItem('useMockAuth') === 'true',
        onProfilePage: window.location.pathname === '/profile.html'
      };
    }
  };

  // Auto-run basic checks on load
  setTimeout(() => {
    console.log('[DebugUtils] ✅ Debug utilities loaded!');
    console.log('[DebugUtils] Available commands:');
    console.log('- __debug.checkAuth() - Check authentication status');
    console.log('- __debug.testApi() - Test API endpoints');
    console.log('- __debug.checkDropdown() - Check dropdown functionality');
    console.log('- __debug.simulateDropdownClick() - Test dropdown click');
    console.log('- __debug.testProfileAccess() - Test profile page access');
    console.log('- __debug.enableMockAuth() - Force enable mock authentication');
    console.log('- __debug.getFullReport() - Get complete debug report');
  }, 1000);
})();
