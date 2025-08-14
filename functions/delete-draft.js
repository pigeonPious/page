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
    const { id } = JSON.parse(event.body);
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Draft ID is required" })
      };
    }

    // Verify the draft belongs to the user before deleting
    const draft = await client.query(
      q.Get(q.Ref(q.Collection('drafts'), id))
    );

    if (draft.data.userId !== user.sub) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Unauthorized to delete this draft" })
      };
    }

    // Delete the draft
    await client.query(
      q.Delete(q.Ref(q.Collection('drafts'), id))
    );

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
