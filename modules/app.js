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
      { name: 'theme', factory: ThemeModule },
      { name: 'taskbar', factory: () => {
        console.log('🔧 Creating taskbar module instance...');
        if (window.TaskbarModule) {
          // Return a proper module instance that wraps TaskbarModule
          return {
            async init() {
              console.log('🔧 Taskbar module init() called');
              if (typeof window.TaskbarModule.init === 'function') {
                await window.TaskbarModule.init();
              } else {
                console.error('TaskbarModule.init() not available');
              }
            },
            load: window.TaskbarModule.load,
            initialize: window.TaskbarModule.initialize
          };
        } else {
          console.error('TaskbarModule not found, creating fallback');
          return { 
            init: () => {
              console.error('Taskbar module init called but TaskbarModule not available');
            }
          };
        }
      }},
      { name: 'console', factory: ConsoleModule }
    ];

    // Register modules
    for (const { name, factory } of modules) {
      if (typeof factory === 'function') {
        console.log(`🔧 Registering module: ${name}`);
        await ppPage.registerModule(name, factory);
        console.log(`✅ Module registered: ${name}`);
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
    
    // Ensure taskbar is loaded - force initialization if needed
    setTimeout(() => {
      const menuBar = document.querySelector('.menu-bar');
      if (!menuBar && window.TaskbarModule) {
        ppPage.log('Taskbar not found, forcing initialization...');
        window.TaskbarModule.init();
      }
    }, 1000);

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
