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

    // Custom theme menu logic
    const customButton = document.querySelector('.menu-entry[data-mode="custom"]');
    if (customButton) {
      customButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showCustomColorMenu(customButton);
      });
    }
  },

  showCustomColorMenu(anchor) {
    // Remove any existing menu
    let existingMenu = document.getElementById('customColorMenu');
    if (existingMenu) existingMenu.remove();

    // Create menu
    const menu = document.createElement('div');
    menu.id = 'customColorMenu';
    menu.innerHTML = `
      <div class="slider-group"><label>H</label><input type="range" min="0" max="360" value="210" id="hueSlider"><span id="hueVal">210</span></div>
      <div class="slider-group"><label>S</label><input type="range" min="0" max="100" value="20" id="satSlider"><span id="satVal">20</span></div>
      <div class="slider-group"><label>L</label><input type="range" min="0" max="100" value="25" id="lightSlider"><span id="lightVal">25</span></div>
      <span class="color-preview" id="colorPreview"></span>
      <button class="close-btn" type="button">Close</button>
    `;
    document.body.appendChild(menu);

    // Position below anchor
    const rect = anchor.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + window.scrollY) + 'px';
    menu.style.zIndex = 2001;
    menu.style.display = 'block';

    // Load last custom color or default
    let h = 210, s = 20, l = 25;
    const last = localStorage.getItem('customBg');
    if (last && last.startsWith('hsl')) {
      const m = last.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
      if (m) { h = +m[1]; s = +m[2]; l = +m[3]; }
    }
    menu.querySelector('#hueSlider').value = h;
    menu.querySelector('#satSlider').value = s;
    menu.querySelector('#lightSlider').value = l;

    // Update preview and theme
    const hueSlider = menu.querySelector('#hueSlider');
    const satSlider = menu.querySelector('#satSlider');
    const lightSlider = menu.querySelector('#lightSlider');
    const hueVal = menu.querySelector('#hueVal');
    const satVal = menu.querySelector('#satVal');
    const lightVal = menu.querySelector('#lightVal');
    const colorPreview = menu.querySelector('#colorPreview');
    const closeBtn = menu.querySelector('.close-btn');

    function hslString() {
      return `hsl(${hueSlider.value},${satSlider.value}%,${lightSlider.value}%)`;
    }
    function updateCustomColor() {
      hueVal.textContent = hueSlider.value;
      satVal.textContent = satSlider.value;
      lightVal.textContent = lightSlider.value;
      const hsl = hslString();
      colorPreview.style.background = hsl;
      localStorage.setItem('customBg', hsl);
      // Set theme and update contrast
      anchor.classList.add('selected');
      setTimeout(() => anchor.classList.remove('selected'), 200);
      window.ppPage.getModule('theme').setTheme('custom', hsl);
    }
    [hueSlider, satSlider, lightSlider].forEach(slider => {
      slider.oninput = updateCustomColor;
    });
    updateCustomColor();

    closeBtn.onclick = () => {
      menu.remove();
      document.removeEventListener('mousedown', outsideClickHandler);
    };

    // Close menu if clicking outside
    function outsideClickHandler(e) {
      if (!menu.contains(e.target) && e.target !== anchor) {
        menu.remove();
        document.removeEventListener('mousedown', outsideClickHandler);
      }
    }
    setTimeout(() => {
      document.addEventListener('mousedown', outsideClickHandler);
    }, 0);
  },

  setTheme(mode, customBg = null) {
    this.currentTheme = mode;
    
    // Remove existing theme classes
    document.body.classList.remove('light-mode', 'dark-mode', 'auto-mode', 'custom-mode');
    
    // Clear custom theme variables if not custom/random
    if (mode !== 'custom' && mode !== 'random') {
      document.body.style.removeProperty('--bg');
      document.body.style.removeProperty('--menu-bg');
      document.body.style.removeProperty('--fg');
      document.body.style.removeProperty('--menu-fg');
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--menu-bg');
      document.documentElement.style.removeProperty('--fg');
      document.documentElement.style.removeProperty('--menu-fg');
      localStorage.removeItem('customBg');
    }
    
    // Apply new theme
    if (mode === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'dark-mode' : 'light-mode');
    } else if (mode === 'custom') {
      document.body.classList.add('custom-mode');
      
      // Apply custom background
      if (customBg) {
        this.applyCustomBackground(customBg);
      } else {
        // Default custom theme
        this.applyCustomBackground('#2a2a2a');
      }
    } else if (mode === 'random') {
      document.body.classList.add('custom-mode');
      
      // Generate random color
      const h = Math.floor(Math.random() * 361);
      const s = Math.floor(Math.random() * 41) + 30; // 30-70%
      const l = Math.floor(Math.random() * 31) + 15; // 15-45%
      const randomColor = `hsl(${h},${s}%,${l}%)`;
      
      this.applyCustomBackground(randomColor);
    } else {
      document.body.classList.add(`${mode}-mode`);
    }

    // Save theme preference
    localStorage.setItem('ppPage_theme', mode);
    
    ppPage.log(`Theme changed to: ${mode}`);
  },

  applyCustomBackground(bgValue) {
    if (bgValue.startsWith('#') || bgValue.startsWith('hsl') || bgValue.startsWith('rgb')) {
      // Set CSS custom properties for consistent theming
      document.body.style.setProperty('--bg', bgValue);
      document.body.style.setProperty('--menu-bg', bgValue);
      
      // Determine brightness for text color
      let rgb;
      if (bgValue.startsWith('#')) {
        rgb = this.hexToRgb(bgValue);
      } else if (bgValue.startsWith('hsl')) {
        rgb = this.hslToRgb(bgValue);
      } else if (bgValue.startsWith('rgb')) {
        rgb = this.parseRgb(bgValue);
      }
      
      if (rgb) {
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        const textColor = brightness > 128 ? '#232323' : '#ffffff';
        
        document.body.style.setProperty('--fg', textColor);
        document.body.style.setProperty('--menu-fg', textColor);
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

  hslToRgb(hsl) {
    // Parse HSL string like "hsl(240, 50%, 25%)"
    const match = hsl.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
    if (!match) return null;
    
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  },

  parseRgb(rgb) {
    // Parse RGB string like "rgb(255, 128, 0)"
    const match = rgb.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (!match) return null;
    
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
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
