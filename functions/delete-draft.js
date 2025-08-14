const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const ADMIN_GITHUB_USERNAME = process.env.ADMIN_GITHUB_USERNAME || 'piouspigeon';
  
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { id } = JSON.parse(event.body);
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Draft ID is required" })
      };
    }

    const store = getStore('drafts');
    const blobKey = `${username}-${id}`;
    
    // Verify the draft exists and belongs to the user
    const existingDraft = await store.get(blobKey);
    if (!existingDraft) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Draft not found" })
      };
    }

    const draftData = JSON.parse(existingDraft);
    if (draftData.userId !== username) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Unauthorized to delete this draft" })
      };
    }

    // Delete the draft
    await store.delete(blobKey);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Error deleting draft:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete draft" })
    };
  }
};
