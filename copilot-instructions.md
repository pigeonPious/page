# Copilot Instructions for PPPage Project

## Core Development Principles

### 1. Event Listener Management
**CRITICAL: Prevent event listener conflicts and duplicates**

```javascript
// ✅ ALWAYS do this when setting up event listeners:
// 1. Clear existing listeners first
const existingElement = element.cloneNode(true);
element.parentNode.replaceChild(existingElement, element);

// 2. Use centralized state management
const componentState = {
  isInitialized: false,
  activeElement: null
};

// 3. Store references for cleanup
element._myComponentHandler = handlerFunction;

// ❌ NEVER do this:
// - Attach listeners without clearing existing ones
// - Use multiple setTimeout calls for the same functionality
// - Assume DOM elements don't have existing listeners
```

### 2. Module Initialization Pattern
**CRITICAL: Use consistent, robust initialization**

```javascript
// ✅ ALWAYS use this pattern for module initialization:
const MyModule = () => ({
  isInitialized: false,
  dependencies: ['core', 'posts'], // Declare dependencies explicitly
  
  async init() {
    if (this.isInitialized) {
      console.warn('Module already initialized, skipping...');
      return;
    }
    
    // Wait for dependencies
    await this.waitForDependencies();
    
    // Initialize with retry logic
    const success = await this.initializeWithRetry();
    if (success) {
      this.isInitialized = true;
    }
  },
  
  async waitForDependencies() {
    for (const dep of this.dependencies) {
      await this.waitForModule(dep);
    }
  },
  
  async initializeWithRetry(maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.doInitialization();
        return true;
      } catch (error) {
        console.error(`Initialization attempt ${attempt} failed:`, error);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        }
      }
    }
    return false;
  }
});

// ❌ NEVER do this:
// - Initialize without checking if already initialized
// - Use arbitrary setTimeout delays without retry logic
// - Initialize without waiting for dependencies
```

### 3. DOM Manipulation Safety
**CRITICAL: Always verify DOM state before manipulation**

```javascript
// ✅ ALWAYS do this for DOM operations:
function safelyManipulateDOM(selector, operation) {
  const element = document.querySelector(selector);
  if (!element) {
    console.error(`Element not found: ${selector}`);
    return false;
  }
  
  // Verify element is in the document
  if (!document.contains(element)) {
    console.error(`Element not in document: ${selector}`);
    return false;
  }
  
  try {
    operation(element);
    return true;
  } catch (error) {
    console.error(`DOM operation failed for ${selector}:`, error);
    return false;
  }
}

// ❌ NEVER do this:
// - Assume elements exist without checking
// - Manipulate DOM without error handling
// - Skip verification that elements are attached to document
```

### 4. State Management Pattern
**CRITICAL: Use centralized state management**

```javascript
// ✅ ALWAYS use centralized state managers:
const ComponentState = {
  data: {},
  listeners: new Set(),
  
  setState(key, value) {
    this.data[key] = value;
    this.notifyListeners(key, value);
  },
  
  getState(key) {
    return this.data[key];
  },
  
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback); // Return cleanup function
  },
  
  notifyListeners(key, value) {
    this.listeners.forEach(callback => {
      try {
        callback(key, value);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  },
  
  cleanup() {
    this.data = {};
    this.listeners.clear();
  }
};

// ❌ NEVER do this:
// - Use global variables for state
// - Manipulate state from multiple places without coordination
// - Forget to provide cleanup mechanisms
```

### 5. Error Handling and Recovery
**CRITICAL: Always include error recovery**

```javascript
// ✅ ALWAYS include comprehensive error handling:
async function robustFunction() {
  try {
    return await primaryOperation();
  } catch (primaryError) {
    console.error('Primary operation failed:', primaryError);
    
    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      console.error('Fallback operation failed:', fallbackError);
      
      // Emergency recovery
      setTimeout(() => {
        console.log('Attempting emergency recovery...');
        emergencyRecovery();
      }, 1000);
      
      throw new Error(`All operations failed: ${primaryError.message}`);
    }
  }
}

// ❌ NEVER do this:
// - Use try/catch without fallback plans
// - Let errors propagate without handling
// - Skip emergency recovery mechanisms
```

### 6. Module Communication Pattern
**CRITICAL: Use event-driven architecture**

```javascript
// ✅ ALWAYS use event bus for module communication:
const ModuleBus = {
  events: new Map(),
  
  emit(event, data) {
    const handlers = this.events.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    });
  },
  
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
    
    // Return cleanup function
    return () => {
      const handlers = this.events.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  },
  
  off(event, handler) {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
};

// ❌ NEVER do this:
// - Access other modules' internals directly
// - Use global variables for module communication
// - Skip event cleanup when modules are destroyed
```

### 7. Testing and Validation Requirements
**CRITICAL: Include validation in all functions**

```javascript
// ✅ ALWAYS include validation and testing:
function validateAndExecute(input, operation) {
  // Input validation
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input provided');
  }
  
  // Pre-condition checks
  if (!this.isReady()) {
    throw new Error('Component not ready for operation');
  }
  
  // Execute with monitoring
  const startTime = Date.now();
  try {
    const result = operation(input);
    
    // Post-condition validation
    if (!this.validateResult(result)) {
      throw new Error('Operation produced invalid result');
    }
    
    console.log(`Operation completed in ${Date.now() - startTime}ms`);
    return result;
  } catch (error) {
    console.error(`Operation failed after ${Date.now() - startTime}ms:`, error);
    throw error;
  }
}

// ❌ NEVER do this:
// - Skip input validation
// - Execute without checking preconditions
// - Skip result validation
```

### 8. File Organization Rules
**CRITICAL: Maintain clean architecture**

```
modules/           ← Core functionality only
  core.js         ← Base system, utilities
  [feature].js    ← Single responsibility modules
  
test/             ← All test files
  unit/           ← Unit tests
  integration/    ← Integration tests
  
archive/          ← Old/deprecated code
  [date]/         ← Dated archives
  
assets/           ← Static resources
data/             ← Configuration files
```

**Rules:**
- One module = one responsibility
- No cross-module direct access (use ModuleBus)
- All test files go in `test/` folder
- Archive old code before replacing
- Use semantic versioning for cache busting

### 9. Console and Debugging Standards
**CRITICAL: Consistent logging and debugging**

```javascript
// ✅ ALWAYS use structured logging:
const Logger = {
  levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
  currentLevel: 2, // INFO
  
  log(level, module, message, data = null) {
    if (this.levels[level] <= this.currentLevel) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${level} [${module}] ${message}`;
      
      console[level.toLowerCase()](logMessage, data || '');
      
      // Send to debug console if available
      if (window.ppPage?.getModule?.('console')?.log) {
        window.ppPage.getModule('console').log(logMessage, level.toLowerCase());
      }
    }
  },
  
  error(module, message, data) { this.log('ERROR', module, message, data); },
  warn(module, message, data) { this.log('WARN', module, message, data); },
  info(module, message, data) { this.log('INFO', module, message, data); },
  debug(module, message, data) { this.log('DEBUG', module, message, data); }
};

// ❌ NEVER do this:
// - Use console.log directly without structure
// - Skip module identification in logs
// - Forget to check if debugging tools are available
```

### 10. Performance and Resource Management
**CRITICAL: Prevent memory leaks and performance issues**

```javascript
// ✅ ALWAYS manage resources properly:
class ResourceManager {
  constructor() {
    this.resources = new Set();
    this.timers = new Set();
    this.listeners = new Set();
  }
  
  addTimer(id) {
    this.timers.add(id);
    return id;
  }
  
  addListener(element, event, handler) {
    element.addEventListener(event, handler);
    const cleanup = () => element.removeEventListener(event, handler);
    this.listeners.add(cleanup);
    return cleanup;
  }
  
  cleanup() {
    // Clear all timers
    this.timers.forEach(id => clearTimeout(id));
    this.timers.clear();
    
    // Remove all listeners
    this.listeners.forEach(cleanup => cleanup());
    this.listeners.clear();
    
    // Clean up other resources
    this.resources.forEach(resource => {
      if (resource.cleanup) resource.cleanup();
    });
    this.resources.clear();
  }
}

// ❌ NEVER do this:
// - Create timers without cleanup
// - Add listeners without removal
// - Skip resource cleanup on module destruction
```

## Project-Specific Rules

### Taskbar/Menu Management
- Only `modules/taskbar.js` manages menu functionality
- Always clear existing event listeners before adding new ones
- Use centralized menu state management
- Include retry logic for initialization
- Never assume DOM elements exist without verification

### Module Loading
- Declare dependencies explicitly in module factory
- Use async/await for all module operations
- Include comprehensive error handling with fallbacks
- Never initialize the same module twice
- Always wait for dependencies before initialization

### Theme Management
- Only `modules/theme.js` handles theme switching
- Support fallback theme switching in taskbar module
- Use CSS custom properties for consistent theming
- Include color parsing for multiple formats (hex, hsl, rgb)
- Persist theme preferences in localStorage

### Console Management
- Only `modules/console.js` manages debug console
- Use feature detection before accessing console methods
- Include console toggle functionality in taskbar
- Support multiple console output formats
- Never assume console module is available

## Code Review Checklist

Before submitting any code, verify:

- [ ] Event listeners are cleaned up before adding new ones
- [ ] Module dependencies are declared and waited for
- [ ] DOM operations include existence checks
- [ ] Error handling includes fallback mechanisms
- [ ] Resource cleanup is implemented
- [ ] Logging uses structured format
- [ ] State management is centralized
- [ ] No direct cross-module access
- [ ] Cache busting versions are updated
- [ ] Test files are in `test/` directory

## Emergency Recovery Pattern

Always include this pattern in critical components:

```javascript
// Emergency recovery for when everything fails
setTimeout(() => {
  if (!this.isWorking()) {
    console.error('Emergency recovery triggered');
    this.emergencyRecover();
  }
}, 5000);
```

## Build and Deployment

- Increment build numbers on every commit
- Update cache-busting versions in HTML files
- Test locally before committing
- Archive old code before major changes
- Include comprehensive test coverage

---

**Remember: Prevention is better than debugging. Write code that prevents issues rather than fixing them after they occur.**
