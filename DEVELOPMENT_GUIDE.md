# PPPage Development Guide

## 🏗️ **Architecture Overview**

PPPage uses a **modular, event-driven architecture** designed for maintainability and extensibility.

### Core Components

1. **Core Module** (`modules/core.js`) - Central module manager with event system
2. **Application** (`modules/app.js`) - Module initialization and lifecycle management
3. **Taskbar** (`modules/taskbar.js`) - Navigation and menu system
4. **Development Config** (`dev-config.js`) - Centralized configuration and utilities

## 🚀 **Adding New Features**

### 1. **Adding New Taskbar Features**

```javascript
// In modules/taskbar.js, add to the TaskbarModule class:

class TaskbarModule {
  // Add new menu item
  generateHTML() {
    return `
      <div class="menu-item" data-menu="new-feature">
        <div class="label">New Feature</div>
        <div class="menu-dropdown">
          <div class="menu-entry" id="new-feature-button">Action</div>
        </div>
      </div>
    `;
  }

  // Bind events
  bindButtonEvents() {
    this.addEventHandler('#new-feature-button', 'click', () => {
      this.handleNewFeature();
    });
  }

  // Handle the action
  handleNewFeature() {
    // Your feature logic here
    console.log('New feature activated!');
  }
}
```

### 2. **Adding New Modules**

```javascript
// Create modules/newmodule.js
const NewModule = () => ({
  async init() {
    console.log('New module initialized');
  },
  
  // Your module methods
  doSomething() {
    console.log('Module action executed');
  },
  
  destroy() {
    // Cleanup code
  }
});

// Export
if (typeof window !== 'undefined') {
  window.NewModule = NewModule;
}
```

Then add to `modules/app.js`:
```javascript
{ name: 'newmodule', factory: window.NewModule }
```

### 3. **Using the Event System**

```javascript
// Emit events
window.ppPage.emit('customEvent', { data: 'value' });

// Listen for events
window.ppPage.on('customEvent', (event) => {
  console.log('Event received:', event.detail);
});
```

## 🔧 **Configuration Management**

### Using DevConfig

```javascript
// Get configuration values
const timeout = DevUtils.get('modules.timeout', 5000);
const debugEnabled = DevUtils.get('debug.enabled', false);

// Set configuration values
DevUtils.set('debug.logLevel', 'debug');
DevUtils.set('custom.setting', 'value');
```

### Adding New Configuration

```javascript
// In dev-config.js
const DevConfig = {
  // ... existing config
  newFeature: {
    enabled: true,
    options: ['option1', 'option2'],
    timeout: 3000
  }
};
```

## 🐛 **Debugging and Troubleshooting**

### 1. **Enable Debug Mode**

```javascript
DevUtils.set('debug.enabled', true);
DevUtils.set('debug.logLevel', 'debug');
```

### 2. **Performance Monitoring**

```javascript
// Measure function performance
const result = DevUtils.measureTime('operation', () => {
  return expensiveOperation();
});

// Async operations
const result = await DevUtils.measureTimeAsync('asyncOperation', async () => {
  return await asyncExpensiveOperation();
});
```

### 3. **Error Reporting**

```javascript
try {
  riskyOperation();
} catch (error) {
  DevUtils.reportError(error, 'RiskyOperation');
}
```

## 📝 **Best Practices**

### 1. **Module Structure**

- Always implement `init()` and `destroy()` methods
- Use the event system for inter-module communication
- Keep modules focused on single responsibilities
- Use `DevUtils.log()` for consistent logging

### 2. **Event Handling**

- Use event delegation for dynamic elements
- Clean up event listeners in `destroy()` methods
- Use the built-in debounce/throttle utilities

### 3. **Performance**

- Use `DevUtils.measureTime()` to identify bottlenecks
- Implement lazy loading for heavy features
- Use the caching system for expensive operations

### 4. **Error Handling**

- Always wrap async operations in try-catch
- Use `DevUtils.reportError()` for consistent error reporting
- Provide fallbacks for critical functionality

## 🧪 **Testing New Features**

### 1. **Local Testing**

```bash
# Start local server
python3 -m http.server 8000
# or
npx serve .
```

### 2. **Module Testing**

```javascript
// Test individual modules
const taskbar = window.TaskbarModule();
await taskbar.init();

// Test specific functionality
taskbar.toggleMenu('file');
```

### 3. **Integration Testing**

```javascript
// Test full system
await window.ppPageApp.init();
const taskbar = window.ppPage.getModule('taskbar');
console.log('Taskbar ready:', taskbar.initialized);
```

## 🔄 **Common Development Workflows**

### 1. **Adding a New Menu Item**

1. Update `generateHTML()` in TaskbarModule
2. Add event binding in `bindButtonEvents()`
3. Implement handler method
4. Test menu interaction
5. Add to configuration if needed

### 2. **Adding a New Module**

1. Create module file in `modules/` directory
2. Implement required interface (init, destroy)
3. Add to app.js module list
4. Test initialization
5. Add configuration options

### 3. **Modifying Existing Features**

1. Locate relevant module
2. Use `DevUtils.log()` to trace execution
3. Make changes incrementally
4. Test thoroughly
5. Update documentation

## 📚 **Useful Utilities**

### Core Utilities

```javascript
// Safe DOM operations
const element = window.ppPage.utils.getElement('#selector');
window.ppPage.utils.addEvent(element, 'click', handler);

// Cache busting
const url = window.ppPage.utils.cacheBustUrl('style.css');

// Debounced functions
const debouncedHandler = window.ppPage.utils.debounce(handler, 300);
```

### Development Utilities

```javascript
// Performance monitoring
DevUtils.measureTime('operation', fn);

// Error reporting
DevUtils.reportError(error, 'context');

// Configuration management
DevUtils.get('path.to.setting', defaultValue);
DevUtils.set('path.to.setting', newValue);
```

## 🚨 **Troubleshooting Common Issues**

### 1. **Taskbar Not Loading**

- Check browser console for errors
- Verify all modules are loaded
- Check if `window.ppPage` exists
- Use `DevUtils.log()` to trace initialization

### 2. **Events Not Working**

- Verify event listeners are bound
- Check for JavaScript errors
- Ensure elements exist in DOM
- Use event delegation for dynamic content

### 3. **Module Communication Issues**

- Check if modules are properly registered
- Verify event names match
- Use `window.ppPage.waitForModule()` for dependencies
- Check module initialization order

## 🔮 **Future Enhancements**

### Planned Features

- Hot reload for development
- Module dependency management
- Plugin system for extensions
- Advanced caching strategies
- Performance analytics dashboard

### Contributing

1. Follow the established patterns
2. Add comprehensive logging
3. Include error handling
4. Update this guide
5. Test thoroughly before submitting

---

**Remember**: The goal is maintainable, extensible code. When in doubt, use the existing patterns and utilities!
