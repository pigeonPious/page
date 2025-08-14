const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const { user } = context.clientContext;
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Authentication required" })
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
    const userPrefix = `${user.sub}-`;
    
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
