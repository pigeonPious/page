# GitHub OAuth App Setup

## 1. Create OAuth App on GitHub

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `PiousPigeon Blog Editor`
   - **Homepage URL**: `https://piouspigeon.com`
   - **Authorization callback URL**: `https://piouspigeon.com` (can be any valid URL)
4. Click "Register application"
5. **Copy the Client ID** (you'll need this)

**⚠️ Important**: 
- For client-side OAuth, you do NOT need to set a client secret
- We use the **device flow** which works entirely in the browser without CORS issues

## 2. Update Client ID in Code

1. **Copy your Client ID** from the OAuth app you just created
2. **Update the client ID** in `site.js` around line 4790:
   ```javascript
   const clientId = 'YOUR_ACTUAL_CLIENT_ID_HERE'; // Replace this
   ```
3. **Update the client ID** in the device flow functions (around line 4800):
   ```javascript
   client_id: 'YOUR_ACTUAL_CLIENT_ID_HERE', // Replace this
   ```

The OAuth app will use these settings:
- **Client ID**: From step 1
- **Redirect URI**: `https://piouspigeon.com/functions/auth-callback.html`
- **Scope**: `repo` (for full repository access)

## 3. Test the OAuth Flow

Once implemented, the flow will be:
1. Click "Login with GitHub" 
2. **Device flow modal appears with authorization code**
3. **Visit GitHub and enter the code** (or click button to open directly)
4. **App automatically detects completion** and stores the token
5. **Redirect to editor** with full access

## Notes

- This replaces Personal Access Token authentication
- **Client-side OAuth with device flow** - No server functions needed
- **No CORS issues** - works entirely in the browser
- **No redirects needed** - user stays on your site
- Works with any hosting (GitHub Pages, Vercel, Netlify, etc.)
- Provides higher rate limits (15k vs 5k requests/hour)
- More stable and reliable than PATs
- Official GitHub authentication method
