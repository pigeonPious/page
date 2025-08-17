/**
 * PPPage Application Initializer
 * Loads and initializes all modules in the correct order
 */

(async function initializePPPage() {
  'use strict';
  
  console.log('🔧 App.js loaded, checking for ppPage...');
  
  // Wait for core to be available with retry logic
  let retryCount = 0;
  const maxRetries = 50; // 5 seconds max
  
  while (typeof window.ppPage === 'undefined' && retryCount < maxRetries) {
    console.log(`Waiting for ppPage core... (${retryCount + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 100));
    retryCount++;
  }
  
  if (typeof window.ppPage === 'undefined') {
    console.error('❌ PPPage Core not found after waiting! Make sure core.js is loaded first.');
    return;
  }
  
  console.log('✅ PPPage Core found, starting initialization...');

  try {
    // Initialize core
    await window.ppPage.init();
    
    window.ppPage.log('Starting application initialization...');
    
    // Wait for all module factories to be available
    const moduleFactories = ['PostsModule', 'NavigationModule', 'EditorModule', 'ThemeModule', 'TaskbarModule', 'ConsoleModule'];
    console.log('🔧 Checking for module factories...');
    
    for (const factoryName of moduleFactories) {
      if (typeof window[factoryName] === 'undefined') {
        console.warn(`⚠️ Module factory ${factoryName} not found`);
      } else {
        console.log(`✅ Found ${factoryName}`);
      }
    }
    
    // Register all modules in dependency order
    const modules = [
      { name: 'posts', factory: window.PostsModule },
      { name: 'navigation', factory: window.NavigationModule },
      { name: 'editor', factory: window.EditorModule },
      { name: 'theme', factory: window.ThemeModule },
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
      { name: 'console', factory: window.ConsoleModule }
    ];

    // Register modules
    for (const { name, factory } of modules) {
      if (typeof factory === 'function') {
        console.log(`🔧 Registering module: ${name}`);
        await window.ppPage.registerModule(name, factory);
        console.log(`✅ Module registered: ${name}`);
      } else {
        window.ppPage.log(`Module factory for '${name}' not found`, 'error');
      }
    }

    // Setup global error handling
    window.addEventListener('error', (event) => {
      window.ppPage.log(`Global error: ${event.error?.message || event.message}`, 'error');
    });

    // Setup unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      window.ppPage.log(`Unhandled promise rejection: ${event.reason}`, 'error');
    });

    window.ppPage.log('Application initialized successfully');

    // Initialize taskbar buttons now that all modules are loaded
    if (window.TaskbarModule && typeof window.TaskbarModule.initialize === 'function') {
      window.ppPage.log('Initializing taskbar button connections...');
      window.TaskbarModule.initialize();
    }
    
    // Ensure taskbar is loaded and functional - force initialization if needed
    setTimeout(() => {
      const menuBar = document.querySelector('.menu-bar');
      if (!menuBar && window.TaskbarModule) {
        window.ppPage.log('Taskbar not found, forcing initialization...');
        window.TaskbarModule.init();
      } else if (menuBar) {
        // Even if taskbar exists, ensure it's fully functional
        const viewMenu = menuBar.querySelector('[data-menu]');
        if (viewMenu) {
          // Test if click events are working
          const testClick = new Event('click', { bubbles: true });
          viewMenu.dispatchEvent(testClick);
          
          // Check if menu opened
          setTimeout(() => {
            const menuItem = viewMenu.closest('.menu-item');
            if (menuItem && !menuItem.classList.contains('open')) {
              window.ppPage.log('Taskbar click events not working, reinitializing...');
              if (window.TaskbarModule && window.TaskbarModule.init) {
                window.TaskbarModule.init();
              }
            } else {
              window.ppPage.log('Taskbar functionality verified');
            }
          }, 100);
        }
      }
    }, 1000);

    // Add periodic taskbar health check
    setInterval(() => {
      const menuBar = document.querySelector('.menu-bar');
      if (!menuBar && window.TaskbarModule) {
        window.ppPage.log('Taskbar disappeared, reinitializing...');
        window.TaskbarModule.init();
      }
    }, 10000); // Check every 10 seconds

    // Expose some global functions for backward compatibility
    window.loadPost = async function(slug) {
      const postsModule = window.ppPage.getModule('posts');
      if (postsModule) {
        return await postsModule.loadPost(slug);
      }
    };

    window.loadPostsWithKeywords = async function() {
      const postsModule = window.ppPage.getModule('posts');
      if (postsModule) {
        return await postsModule.loadPosts();
      }
    };

    // Trigger any URL-based navigation
    if (window.location.hash && window.location.hash.length > 1) {
      const slug = window.location.hash.substring(1);
      const postsModule = window.ppPage.getModule('posts');
      if (postsModule) {
        try {
          await postsModule.loadPost(slug);
        } catch (error) {
          window.ppPage.log(`Failed to load post from URL hash: ${error.message}`, 'error');
        }
      }
    }

  } catch (error) {
    console.error('Failed to initialize PPPage application:', error);
  }
})();
