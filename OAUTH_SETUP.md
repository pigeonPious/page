# GitHub OAuth App Setup

## 1. Create OAuth App on GitHub

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `PiousPigeon Blog Editor`
   - **Homepage URL**: `https://piouspigeon.com`
   - **Authorization callback URL**: `https://piouspigeon.com/functions/auth-callback.html`
4. Click "Register application"
5. **Copy the Client ID** (you'll need this)

**⚠️ Important**: For client-side OAuth, you do NOT need to set a client secret.

## 2. Update Client ID in Code

1. **Copy your Client ID** from the OAuth app you just created
2. **Update the client ID** in `site.js` around line 4790:
   ```javascript
   const clientId = 'YOUR_ACTUAL_CLIENT_ID_HERE'; // Replace this
   ```
3. **Update the client ID** in `functions/auth-callback.html` around line 95:
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
2. Redirect to GitHub authorization
3. Authorize the app
4. Return to your blog with full access

## Notes

- This replaces Personal Access Token authentication
- **Client-side OAuth** - No server functions needed
- Works with any hosting (GitHub Pages, Vercel, Netlify, etc.)
- Provides higher rate limits (15k vs 5k requests/hour)
- More stable and reliable than PATs
- Official GitHub authentication method
