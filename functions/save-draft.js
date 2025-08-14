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
    const { id, title, content, category } = JSON.parse(event.body);
    
    if (!title || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Title and content are required" })
      };
    }

    const store = getStore('drafts');
    const draftId = id || `draft-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Get existing draft if updating
    let existingDraft = null;
    if (id) {
      try {
        const existing = await store.get(`${username}-${id}`);
        existingDraft = existing ? JSON.parse(existing) : null;
      } catch (error) {
        // Draft doesn't exist, that's fine for new ones
      }
    }

    const draftData = {
      id: draftId,
      title,
      content,
      category: category || 'general',
      userId: username,
      created: existingDraft ? existingDraft.created : now,
      modified: now
    };

    // Save to Netlify Blob Store
    await store.set(`${username}-${draftId}`, JSON.stringify(draftData));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, draft: draftData })
    };

  } catch (error) {
    console.error('Error saving draft:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save draft" })
    };
  }
};
