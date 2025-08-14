// GitHub OAuth callback handler for simple admin authentication
exports.handler = async (event, context) => {
  const ADMIN_GITHUB_USERNAME = process.env.ADMIN_GITHUB_USERNAME || 'pigeonPious';
  
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { code, state } = event.queryStringParameters || {};
  
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Authorization code required' })
    };
  }

  try {
    // Exchange code for access token
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
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'User-Agent': 'ppPage-Blog'
      }
    });

    const userData = await userResponse.json();
    
    // Debug logging
    console.log('OAuth callback - userData:', userData);
    console.log('OAuth callback - expected admin:', ADMIN_GITHUB_USERNAME);
    console.log('OAuth callback - environment:', process.env.CONTEXT);
    
    // Check if user is the admin
    const isAdmin = userData.login === ADMIN_GITHUB_USERNAME;
    
    if (isAdmin) {
      // Create a simple session token (you might want to use JWT in production)
      const sessionToken = Buffer.from(`${userData.login}:${Date.now()}`).toString('base64');
      
      // Set secure cookie and redirect to original destination
      // Force to use non-secure cookies for now to debug
      const cookieFlags = 'HttpOnly; SameSite=Lax; Max-Age=86400; Path=/';
      
      console.log('OAuth callback - setting cookie with flags:', cookieFlags);
      console.log('OAuth callback - session token:', sessionToken);
      
      const headers = {
        'Set-Cookie': `admin_session=${sessionToken}; ${cookieFlags}`,
        'Location': state || '/editor.html'
      };
      
      console.log('OAuth callback - redirect headers:', headers);
      
      return {
        statusCode: 302,
        headers: headers,
        body: ''
      };
    } else {
      // Not the admin - redirect to main page
      return {
        statusCode: 302,
        headers: {
          'Location': '/index.html'
        },
        body: ''
      };
    }
    
  } catch (error) {
    console.error('OAuth error:', error);
    return {
      statusCode: 500,
      headers: {
        'Location': '/index.html'
      },
      body: ''
    };
  }
};
