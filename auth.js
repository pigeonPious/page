// Simple GitHub OAuth authentication
class AuthManager {
  constructor() {
    this.user = null;
    this.init();
  }

  async init() {
    await this.checkAuthStatus();
    this.updateUI();
    this.checkAuthRequirement();
  }

  async checkAuthStatus() {
    try {
      const response = await fetch('/.netlify/functions/auth-check');
      const data = await response.json();
      
      if (data.authenticated) {
        this.user = data.user;
      } else {
        this.user = null;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.user = null;
    }
  }

  updateUI() {
    // Update authentication status in UI
    const authElements = document.querySelectorAll('[data-auth]');
    authElements.forEach(el => {
      if (el.dataset.auth === 'login' && !this.user) {
        el.style.display = 'block';
        el.addEventListener('click', () => this.initiateLogin());
      } else if (el.dataset.auth === 'logout' && this.user) {
        el.style.display = 'block';
        el.addEventListener('click', () => this.logout());
      } else {
        el.style.display = 'none';
      }
    });
  }

  initiateLogin() {
    // Redirect to a simple login page that will handle GitHub OAuth
    const currentPath = window.location.pathname;
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
  }

  async logout() {
    try {
      await fetch('/.netlify/functions/logout', {
        method: 'POST'
      });
      
      this.user = null;
      this.updateUI();
      
      // Redirect to home if on protected page
      if (this.isProtectedPage()) {
        window.location.href = 'index.html';
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  showLoginRequired() {
    // Instead of complex auth, show pigeon test
    window.location.href = '/pigeon-test.html';
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
      // Redirect to pigeon test for unauthorized access
      this.showLoginRequired();
    }
  }

  getAuthHeaders() {
    // For the simple system, we rely on cookies
    return {
      'Content-Type': 'application/json'
    };
  }

  getUserInfo() {
    return this.user ? {
      username: this.user.username,
      isAdmin: this.user.isAdmin
    } : null;
  }
}

// Initialize auth manager
const authManager = new AuthManager();
