// Simple authentication check for GitHub OAuth admin
exports.handler = async (event, context) => {
  const ADMIN_GITHUB_USERNAME = process.env.ADMIN_GITHUB_USERNAME || 'piouspigeon';
  
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check for admin session cookie
    const cookies = event.headers.cookie || '';
    console.log('Auth check - received cookies:', cookies);
    
    const adminSessionMatch = cookies.match(/admin_session=([^;]+)/);
    
    if (!adminSessionMatch) {
      console.log('Auth check - no admin session cookie found');
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          authenticated: false,
          message: 'No admin session found',
          receivedCookies: cookies
        })
      };
    }

    const sessionToken = adminSessionMatch[1];
    console.log('Auth check - found session token:', sessionToken);
    
    try {
      // Decode the simple session token
      const decoded = Buffer.from(sessionToken, 'base64').toString();
      const [username, timestamp] = decoded.split(':');
      
      console.log('Auth check - decoded session:', { username, timestamp });
      
      // Check if session is valid (24 hours)
      const sessionAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      console.log('Auth check - session age:', sessionAge, 'maxAge:', maxAge);
      
      if (sessionAge > maxAge) {
        console.log('Auth check - session expired');
        return {
          statusCode: 401,
          body: JSON.stringify({ 
            authenticated: false,
            message: 'Session expired',
            sessionAge: sessionAge,
            maxAge: maxAge
          })
        };
      }
      
      // Check if user is the admin
      if (username === ADMIN_GITHUB_USERNAME) {
        console.log('Auth check - successful authentication for:', username);
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            authenticated: true,
            user: {
              username: username,
              isAdmin: true
            }
          })
        };
      } else {
        return {
          statusCode: 401,
          body: JSON.stringify({ 
            authenticated: false,
            message: 'Not authorized' 
          })
        };
      }
      
    } catch (decodeError) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          authenticated: false,
          message: 'Invalid session token' 
        })
      };
    }
    
  } catch (error) {
    console.error('Auth check error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        authenticated: false,
        message: 'Server error' 
      })
    };
  }
};
