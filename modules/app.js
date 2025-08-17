/**
 * PPPage Application Initializer
 * Loads and initializes all modules in the correct order
 */

(async function initializePPPage() {
  'use strict';
  
  // Wait for core to be available
  if (typeof ppPage === 'undefined') {
    console.error('PPPage Core not found! Make sure core.js is loaded first.');
    return;
  }

  try {
    // Initialize core
    await ppPage.init();
    
    ppPage.log('Starting application initialization...');
    
    // Register all modules in dependency order
    const modules = [
      { name: 'posts', factory: PostsModule },
      { name: 'navigation', factory: NavigationModule },
      { name: 'editor', factory: EditorModule },
      { name: 'theme', factory: ThemeModule }
    ];

    // Register modules
    for (const { name, factory } of modules) {
      if (typeof factory === 'function') {
        await ppPage.registerModule(name, factory);
      } else {
        ppPage.log(`Module factory for '${name}' not found`, 'error');
      }
    }

    // Setup global error handling
    window.addEventListener('error', (event) => {
      ppPage.log(`Global error: ${event.error?.message || event.message}`, 'error');
    });

    // Setup unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      ppPage.log(`Unhandled promise rejection: ${event.reason}`, 'error');
    });

    ppPage.log('Application initialized successfully');

    // Initialize taskbar buttons now that all modules are loaded
    if (window.TaskbarModule && typeof window.TaskbarModule.initialize === 'function') {
      ppPage.log('Initializing taskbar button connections...');
      window.TaskbarModule.initialize();
    }

    // Expose some global functions for backward compatibility
    window.loadPost = async function(slug) {
      const postsModule = ppPage.getModule('posts');
      if (postsModule) {
        return await postsModule.loadPost(slug);
      }
    };

    window.loadPostsWithKeywords = async function() {
      const postsModule = ppPage.getModule('posts');
      if (postsModule) {
        return await postsModule.loadPosts();
      }
    };

    // Trigger any URL-based navigation
    if (window.location.hash && window.location.hash.length > 1) {
      const slug = window.location.hash.substring(1);
      const postsModule = ppPage.getModule('posts');
      if (postsModule) {
        try {
          await postsModule.loadPost(slug);
        } catch (error) {
          ppPage.log(`Failed to load post from URL hash: ${error.message}`, 'error');
        }
      }
    }

  } catch (error) {
    console.error('Failed to initialize PPPage application:', error);
  }
})();
