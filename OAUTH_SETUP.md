# GitHub Personal Access Token Setup

## 1. Create Personal Access Token on GitHub

1. Go to [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Fill in the details:
   - **Note**: `PiousPigeon Blog Editor`
   - **Expiration**: `No expiration` (or at least 1 year)
   - **Scopes**: Check `repo` (full repository access)
4. Click "Generate token"
5. **Copy the token** (starts with `ghp_`) - you won't see it again!

## 2. Use the Token

1. **Copy your Personal Access Token** from step 1
2. **Click "Login with GitHub"** in your blog editor
3. **Paste the token** into the input field
4. **Click "Authenticate"** to complete login

The token provides:
- **Full repository access** to your blog
- **Higher rate limits** than unauthenticated requests
- **Secure access** to publish and edit posts

## 3. Test the Authentication

Once implemented, the flow will be:
1. Click "Login with GitHub" 
2. **Enhanced modal appears** with token input
3. **Paste your Personal Access Token** into the field
4. **Click "Authenticate"** to verify the token
5. **Token is stored securely** in localStorage
6. **Full access** to blog editor

## Notes

- **Simple and reliable** - no complex OAuth flows
- **No server functions needed** - works entirely client-side
- **No CORS issues** - direct GitHub API calls
- Works with any hosting (GitHub Pages, Vercel, Netlify, etc.)
- **Secure token storage** in browser localStorage
- **Higher rate limits** than unauthenticated requests
- **Official GitHub method** for personal access
