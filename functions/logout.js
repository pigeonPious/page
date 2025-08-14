// Logout handler for GitHub OAuth admin
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Clear the admin session cookie
  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': 'admin_session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      success: true,
      message: 'Logged out successfully' 
    })
  };
};
