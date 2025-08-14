// Test to check environment variables and settings
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      adminUsername: process.env.ADMIN_GITHUB_USERNAME || 'pigeonPious',
      context: process.env.CONTEXT,
      hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
      hasGithubSecret: !!process.env.GITHUB_CLIENT_SECRET,
      timestamp: new Date().toISOString()
    })
  };
};
