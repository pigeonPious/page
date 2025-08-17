/**
 * Navigation Module
 * Handles all navigation menus, dropdowns, and post browsing
 */

const NavigationModule = () => ({
  posts: [],
  
  async init() {
    ppPage.log('Initializing Navigation module...');
    // Wait for posts to be loaded before populating menus
    const postsModule = ppPage.getModule('posts');
    if (postsModule) {
      // If posts are not loaded, wait for posts-loaded event
      if (!postsModule.posts || postsModule.posts.length === 0) {
        document.addEventListener('posts-loaded', () => {
          this.posts = postsModule.getAllPosts();
          this.setupNavigationMenus();
        }, { once: true });
      } else {
        this.posts = postsModule.getAllPosts();
        this.setupNavigationMenus();
      }
    }
  },

  setupNavigationMenus() {
    this.setupStarButton();
    this.setupMostRecentButton();
    this.setupRandomPostButton();
    this.setupAllPostsMenu();
    this.setupDevlogMenu();
    this.setupPostDropdown();
    // Ensure dropdowns are initialized after menu population
    if (typeof initializeMenuDropdowns === 'function') {
      initializeMenuDropdowns();
    }
  },

  setupStarButton() {
    const starButton = ppPage.utils.getElement('#star-button');
    if (starButton) {
      ppPage.utils.addEvent(starButton, 'click', () => {
        const mostRecent = this.getMostRecentPost();
        if (mostRecent) {
          this.navigateToPost(mostRecent.slug);
        }
      });
    }
  },

  setupMostRecentButton() {
    const button = ppPage.utils.getElement('#most-recent-post');
    if (button) {
      ppPage.utils.addEvent(button, 'click', () => {
        const mostRecent = this.getMostRecentPost();
        if (mostRecent) {
          this.navigateToPost(mostRecent.slug);
        }
      });
    }
  },

  setupRandomPostButton() {
    const button = ppPage.utils.getElement('#random-post');
    if (button) {
      ppPage.utils.addEvent(button, 'click', () => {
        const randomPost = this.getRandomPost();
        if (randomPost) {
          this.navigateToPost(randomPost.slug);
        }
      });
    }
  },

  setupAllPostsMenu() {
    const menu = ppPage.utils.getElement('#all-posts-menu');
    if (!menu) return;

    // Remove any existing submenu to prevent duplicates
    const oldSubmenu = menu.querySelector('.menu-submenu');
    if (oldSubmenu) {
      oldSubmenu.remove();
    }

    // Create submenu
    const submenu = document.createElement('div');
    submenu.className = 'menu-submenu';
    
    this.posts.forEach(post => {
      const postEntry = document.createElement('div');
      postEntry.className = 'menu-entry';
      postEntry.textContent = post.title;
      postEntry.tabIndex = 0;
      postEntry.setAttribute('role', 'menuitem');
      // Use ppPage.utils.addEvent to ensure correct context
      ppPage.utils.addEvent(postEntry, 'click', () => {
        this.navigateToPost(post.slug);
      });
      submenu.appendChild(postEntry);
    });
    
    menu.appendChild(submenu);
  },

  setupDevlogMenu() {
    const menu = ppPage.utils.getElement('#devlog-menu');
    if (!menu) return;

    // Group devlog posts by project
    const devlogProjects = {};
    this.posts.forEach(post => {
      if (post.category && post.category.startsWith('devlog:')) {
        const project = post.category.replace('devlog:', '');
        if (!devlogProjects[project]) {
          devlogProjects[project] = [];
        }
        devlogProjects[project].push(post);
      }
    });

    // Create submenu
    const submenu = document.createElement('div');
    submenu.className = 'menu-submenu';
    
    Object.entries(devlogProjects).forEach(([project, posts]) => {
      // Project header
      const projectHeader = document.createElement('div');
      projectHeader.className = 'menu-entry category-header';
      projectHeader.textContent = project;
      projectHeader.style.fontWeight = 'bold';
      projectHeader.style.backgroundColor = 'var(--border)';
      submenu.appendChild(projectHeader);
      
      // Project posts
      posts.forEach(post => {
        const postEntry = document.createElement('div');
        postEntry.className = 'menu-entry';
        postEntry.style.paddingLeft = '20px';
        postEntry.textContent = post.title;
        ppPage.utils.addEvent(postEntry, 'click', () => {
          this.navigateToPost(post.slug);
        });
        submenu.appendChild(postEntry);
      });
    });
    
    menu.appendChild(submenu);
  },

  setupPostDropdown() {
    const dropdown = ppPage.utils.getElement('#post-list-dropdown');
    if (!dropdown) return;

    // Clear existing content
    dropdown.innerHTML = '';

    // Add refresh button
    const refreshButton = document.createElement('div');
    refreshButton.className = 'menu-entry';
    refreshButton.id = 'refresh-posts';
    refreshButton.textContent = 'Refresh Posts';
    ppPage.utils.addEvent(refreshButton, 'click', async () => {
      await this.refreshPosts();
    });
    dropdown.appendChild(refreshButton);

    // Group posts by category
    const postsModule = ppPage.getModule('posts');
    if (postsModule) {
      const categorizedPosts = postsModule.getCategorizedPosts();
      
      Object.entries(categorizedPosts).forEach(([category, posts]) => {
        // Category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'menu-entry category-header';
        categoryHeader.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryHeader.style.fontWeight = 'bold';
        categoryHeader.style.backgroundColor = 'var(--border)';
        dropdown.appendChild(categoryHeader);
        
        // Category posts
        posts.forEach(post => {
          const postEntry = document.createElement('div');
          postEntry.className = 'menu-entry';
          postEntry.style.paddingLeft = '20px';
          postEntry.textContent = post.title;
          ppPage.utils.addEvent(postEntry, 'click', () => {
            this.navigateToPost(post.slug);
          });
          dropdown.appendChild(postEntry);
        });
      });
    }
  },

  async refreshPosts() {
    ppPage.log('Refreshing posts...');
    
    const postsModule = ppPage.getModule('posts');
    if (postsModule) {
      await postsModule.loadPosts();
      this.posts = postsModule.getAllPosts();
      this.setupNavigationMenus();
      // Re-populate All Posts submenu after refresh
      this.setupAllPostsMenu();
      ppPage.log('Posts refreshed successfully');
    }
  },

  async navigateToPost(slug) {
    const postsModule = ppPage.getModule('posts');
    if (postsModule) {
      try {
        await postsModule.loadPost(slug);
        ppPage.log(`Navigated to post: ${slug}`);
        // Re-populate All Posts submenu after navigation
        this.setupAllPostsMenu();
      } catch (error) {
        ppPage.log(`Failed to navigate to post '${slug}': ${error.message}`, 'error');
      }
    }
  },

  getMostRecentPost() {
    return this.posts[0] || null;
  },

  getRandomPost() {
    if (this.posts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.posts.length);
    return this.posts[randomIndex];
  },

  // Method called by taskbar buttons
  showAllPostsMenu() {
    ppPage.log('Showing all posts menu...');
    
    // For now, just navigate to the first post or show a list
    if (this.posts.length > 0) {
      // Could show a dropdown or navigate to a posts listing page
      // For now, just load the most recent post
      const postsModule = ppPage.getModule('posts');
      if (postsModule) {
        postsModule.loadLatestPost();
      }
    } else {
      ppPage.log('No posts available to show', 'warning');
    }
  }
});

// Export the module factory
if (typeof window !== 'undefined') {
  window.NavigationModule = () => NavigationModule(); // Always return a new instance for proper lifecycle
}
