const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET
});

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

    const draftData = {
      id: id || `draft-${Date.now()}`,
      title,
      content,
      category: category || 'general',
      userId: user.sub,
      created: id ? undefined : new Date().toISOString(),
      modified: new Date().toISOString()
    };

    let result;
    if (id) {
      // Update existing draft
      result = await client.query(
        q.Update(
          q.Ref(q.Collection('drafts'), id),
          { data: draftData }
        )
      );
    } else {
      // Create new draft
      result = await client.query(
        q.Create(q.Collection('drafts'), { data: draftData })
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, draft: result.data })
    };

  } catch (error) {
    console.error('Error saving draft:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save draft" })
    };
  }
};
