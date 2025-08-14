const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const { user } = context.clientContext;
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Authentication required" })
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
        const existing = await store.get(`${user.sub}-${id}`);
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
      userId: user.sub,
      created: existingDraft ? existingDraft.created : now,
      modified: now
    };

    // Save to Netlify Blob Store
    await store.set(`${user.sub}-${draftId}`, JSON.stringify(draftData));

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
