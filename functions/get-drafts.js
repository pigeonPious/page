const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const ADMIN_GITHUB_USERNAME = process.env.ADMIN_GITHUB_USERNAME || 'pigeonPious';
  
  // Check authentication via cookie
  const cookies = event.headers.cookie || '';
  const adminSessionMatch = cookies.match(/admin_session=([^;]+)/);
  
  if (!adminSessionMatch) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Authentication required" })
    };
  }

  let username;
  try {
    // Verify session token
    const sessionToken = adminSessionMatch[1];
    const decoded = Buffer.from(sessionToken, 'base64').toString();
    const [user, timestamp] = decoded.split(':');
    username = user;
    
    // Check if session is valid (24 hours)
    const sessionAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge || username !== ADMIN_GITHUB_USERNAME) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Session expired or unauthorized" })
      };
    }
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid session" })
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const store = getStore('drafts');
    
    // List all blobs and filter by user
    const { blobs } = await store.list();
    const userPrefix = `${username}-`;
    
    const userDrafts = [];
    
    // Get all drafts for this user
    for (const blob of blobs) {
      if (blob.key.startsWith(userPrefix)) {
        try {
          const draftData = await store.get(blob.key);
          if (draftData) {
            const draft = JSON.parse(draftData);
            userDrafts.push(draft);
          }
        } catch (error) {
          console.error(`Error parsing draft ${blob.key}:`, error);
        }
      }
    }

    // Sort by modified date (most recent first)
    userDrafts.sort((a, b) => new Date(b.modified) - new Date(a.modified));

    return {
      statusCode: 200,
      body: JSON.stringify(userDrafts)
    };

  } catch (error) {
    console.error('Error getting drafts:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to get drafts" })
    };
  }
};
