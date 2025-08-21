const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { code, state } = JSON.parse(event.body);

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Authorization code is required' })
      };
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: 'https://piouspigeon.com/functions/auth-callback.html'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(`GitHub error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token received from GitHub');
    }

    // Get user information using the access token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to get user info: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    // Check if user is the admin (pigeonPious)
    const isAdmin = userData.login === 'pigeonPious';

    if (!isAdmin) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Access denied. Only pigeonPious can access this blog editor.' })
      };
    }

    // Return success with access token and user info
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        access_token: accessToken,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
        user: {
          login: userData.login,
          id: userData.id,
          name: userData.name,
          avatar_url: userData.avatar_url
        }
      })
    };

  } catch (error) {
    console.error('OAuth token exchange error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error during authentication',
        details: error.message 
      })
    };
  }
};
