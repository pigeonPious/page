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
      });

      netlifyIdentity.on('login', user => {
        this.user = user;
        this.updateUI();
        netlifyIdentity.close();
      });

      netlifyIdentity.on('logout', () => {
        this.user = null;
        this.updateUI();
        window.location.href = '/';
      });

      // Initialize Netlify Identity
      netlifyIdentity.init();
    }
  }

  updateUI() {
    const isEditor = window.location.pathname.includes('editor.html') || 
                    window.location.pathname.includes('drafts.html');
    
    if (isEditor && !this.user) {
      // Redirect to login if trying to access editor without auth
      this.showLoginRequired();
    }
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
}

// Initialize auth manager
const authManager = new AuthManager();
