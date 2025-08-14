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
    const { id } = JSON.parse(event.body);
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Draft ID is required" })
      };
    }

    const store = getStore('drafts');
    const blobKey = `${user.sub}-${id}`;
    
    // Verify the draft exists and belongs to the user
    const existingDraft = await store.get(blobKey);
    if (!existingDraft) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Draft not found" })
      };
    }

    const draftData = JSON.parse(existingDraft);
    if (draftData.userId !== user.sub) {
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
