exports.handler = async (event, context) => {
  const cookies = event.headers.cookie || '';
  
  // Log all available information
  console.log('=== COOKIE DEBUG ===');
  console.log('Raw cookies:', cookies);
  console.log('Event headers:', JSON.stringify(event.headers, null, 2));
  console.log('Admin username env:', process.env.ADMIN_GITHUB_USERNAME);
  
  // Parse admin session
  const adminSessionMatch = cookies.match(/admin_session=([^;]+)/);
  
  let sessionInfo = null;
  if (adminSessionMatch) {
    try {
      const sessionToken = adminSessionMatch[1];
      const decoded = Buffer.from(sessionToken, 'base64').toString();
      const [username, timestamp] = decoded.split(':');
      
      sessionInfo = {
        found: true,
        token: sessionToken,
        decoded: decoded,
        username: username,
        timestamp: timestamp,
        age: Date.now() - parseInt(timestamp),
        maxAge: 24 * 60 * 60 * 1000,
        isValid: (Date.now() - parseInt(timestamp)) < (24 * 60 * 60 * 1000),
        isCorrectUser: username === (process.env.ADMIN_GITHUB_USERNAME || 'pigeonPious')
      };
    } catch (error) {
      sessionInfo = {
        found: true,
        error: error.message
      };
    }
  } else {
    sessionInfo = {
      found: false
    };
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      cookies: cookies,
      sessionInfo: sessionInfo,
      adminUsername: process.env.ADMIN_GITHUB_USERNAME || 'pigeonPious'
    }, null, 2)
  };
};
