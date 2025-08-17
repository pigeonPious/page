/**
 * Theme Module
 * Handles theme switching, view options, and styling
 */

const ThemeModule = () => ({
  currentTheme: 'light',
  
  async init() {
    ppPage.log('Initializing Theme module...');
    
    this.loadTheme();
    this.setupThemeControls();
    this.setupViewMenu();
  },

  loadTheme() {
    const savedTheme = localStorage.getItem('ppPage_theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    }
  },

  setupThemeControls() {
    // Setup theme mode buttons
    document.querySelectorAll('[data-mode]').forEach(button => {
      ppPage.utils.addEvent(button, 'click', (e) => {
        const mode = e.target.getAttribute('data-mode');
        const customBg = e.target.getAttribute('data-custom-bg');
        this.setTheme(mode, customBg);
      });
    });
  },

  setupViewMenu() {
    // Setup view menu items
    const viewMenuItems = {
      'light-mode': () => this.setTheme('light'),
      'dark-mode': () => this.setTheme('dark'),
      'auto-mode': () => this.setTheme('auto'),
      'toggle-sidebar': () => this.toggleSidebar()
    };

    Object.entries(viewMenuItems).forEach(([id, handler]) => {
      const element = ppPage.utils.getElement(`#${id}`);
      if (element) {
        ppPage.utils.addEvent(element, 'click', handler);
      }
    });
  },

  setTheme(mode, customBg = null) {
    this.currentTheme = mode;
    
    // Remove existing theme classes
    document.body.classList.remove('light-mode', 'dark-mode', 'auto-mode');
    
    // Apply new theme
    if (mode === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'dark-mode' : 'light-mode');
    } else {
      document.body.classList.add(`${mode}-mode`);
    }

    // Apply custom background if provided
    if (customBg) {
      this.applyCustomBackground(customBg);
    }

    // Save theme preference
    localStorage.setItem('ppPage_theme', mode);
    
    ppPage.log(`Theme changed to: ${mode}`);
  },

  applyCustomBackground(bgValue) {
    if (bgValue.startsWith('#')) {
      // Hex color
      document.body.style.backgroundColor = bgValue;
      
      // Adjust text color based on background brightness
      const rgb = this.hexToRgb(bgValue);
      const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      
      if (brightness > 128) {
        document.body.style.color = '#000';
      } else {
        document.body.style.color = '#fff';
      }
    }
  },

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  toggleSidebar() {
    const sidebar = ppPage.utils.getElement('#sidebar-posts');
    if (sidebar) {
      const isHidden = sidebar.style.display === 'none';
      sidebar.style.display = isHidden ? 'block' : 'none';
      
      ppPage.log(`Sidebar ${isHidden ? 'shown' : 'hidden'}`);
    }
  },

  getCurrentTheme() {
    return this.currentTheme;
  }
});

// Export the module factory
if (typeof window !== 'undefined') {
  window.ThemeModule = ThemeModule;
}
