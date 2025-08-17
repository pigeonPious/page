# Local Server Test Instructions

## Quick Start

1. **Start the server:**
   ```bash
   cd /Users/julianelwood/Developer/ppPage/page
   node server-test.js
   ```

2. **Open test pages:**
   - Main page: http://localhost:3000/
   - Server test: http://localhost:3000/server-test.html
   - Taskbar test: http://localhost:3000/taskbar-final-test.html

## What This Tests

### HTTP vs File Protocol
- Tests module loading over HTTP instead of file://
- Verifies CORS policies work correctly
- Ensures cache-busting parameters function properly

### Real Server Environment
- Simulates actual web hosting conditions
- Tests network request handling
- Validates MIME type serving

### Taskbar Robustness
- Verifies taskbar loads over HTTP
- Tests menu interactions in server environment
- Validates theme switching functionality
- Checks persistence across page reloads

## Expected Results

✅ **All modules should load without errors**
✅ **Taskbar should appear and be functional**
✅ **Custom and Random themes should work**
✅ **No CORS or network errors in console**
✅ **Build indicator should show "alpine"**

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000
# Kill the process
kill -9 $(lsof -ti:3000)
```

### Module Loading Issues
- Check browser console for 404 errors
- Verify all module files exist in modules/ directory
- Ensure file permissions allow reading

### Network Monitoring
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check for:
   - All JS files load with 200 status
   - CSS loads with correct version
   - No failed requests

## Server Features

- **Static file serving** with proper MIME types
- **Cache-Control headers** set to no-cache for testing
- **Security protection** against directory traversal
- **Graceful shutdown** with Ctrl+C
- **Error handling** for common issues

## Test Scenarios

1. **Fresh Load Test:**
   - Start server
   - Visit http://localhost:3000/
   - Verify taskbar appears

2. **Interaction Test:**
   - Click View menu
   - Try Custom theme
   - Try Random theme
   - Verify changes apply

3. **Persistence Test:**
   - Apply a theme
   - Reload page (Ctrl+R)
   - Verify theme persists
   - Verify taskbar still functions

4. **Error Recovery Test:**
   - Disable JavaScript temporarily
   - Re-enable JavaScript
   - Verify system recovers

## Success Criteria

The server test passes when:
- ✅ Server starts without errors
- ✅ All modules load over HTTP
- ✅ Taskbar appears and functions
- ✅ Theme switching works
- ✅ Page reloads maintain functionality
- ✅ No console errors or warnings
