// Netlify Identity integration
class AuthManager {
  constructor() {
    this.user = null;
    this.init();
  }

  init() {
    // Check if Netlify Identity is available
    if (typeof netlifyIdentity !== 'undefined') {
      netlifyIdentity.on('init', user => {
        this.user = user;
        this.updateUI();
        this.checkAuthRequirement();
      });

      netlifyIdentity.on('login', user => {
        this.user = user;
        this.updateUI();
        netlifyIdentity.close();
        // Reload page if on protected page to load content
        if (this.isProtectedPage()) {
          window.location.reload();
        }
      });

      netlifyIdentity.on('logout', () => {
        this.user = null;
        this.updateUI();
        // Redirect to home if on protected page
        if (this.isProtectedPage()) {
          window.location.href = 'index.html';
        }
      });

      // Initialize Netlify Identity
      netlifyIdentity.init();
    } else {
      console.warn('Netlify Identity not loaded - running in development mode');
    }
  }

  updateUI() {
    // Update authentication status in UI
    const authElements = document.querySelectorAll('[data-auth]');
    authElements.forEach(el => {
      if (el.dataset.auth === 'login' && !this.user) {
        el.style.display = 'block';
        el.addEventListener('click', () => netlifyIdentity.open());
      } else if (el.dataset.auth === 'logout' && this.user) {
        el.style.display = 'block';
        el.addEventListener('click', () => netlifyIdentity.logout());
      } else {
        el.style.display = 'none';
      }
    });
  }

  showLoginRequired() {
    if (typeof netlifyIdentity !== 'undefined') {
      netlifyIdentity.open();
    } else {
      alert('Authentication required. Please reload the page and try again.');
      window.location.href = '/';
    }
  }

  isAuthenticated() {
    return this.user !== null;
  }

  getUser() {
    return this.user;
  }

  isProtectedPage() {
    const protectedPages = ['editor.html', 'drafts.html'];
    const currentPage = window.location.pathname.split('/').pop();
    return protectedPages.includes(currentPage);
  }

  checkAuthRequirement() {
    const protectedPages = ['editor.html', 'drafts.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !this.user) {
      // Show login modal for protected pages
      if (typeof netlifyIdentity !== 'undefined') {
        netlifyIdentity.open();
      } else {
        // Development mode - allow access
        console.log('Development mode: bypassing authentication');
      }
    }
  }

  getAuthHeaders() {
    if (this.user && this.user.token) {
      return {
        'Authorization': `Bearer ${this.user.token.access_token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  getUserInfo() {
    return this.user ? {
      id: this.user.id,
      email: this.user.email,
      name: this.user.user_metadata?.full_name || this.user.email,
      roles: this.user.app_metadata?.roles || []
    } : null;
  }
}

// Initialize auth manager
const authManager = new AuthManager();
