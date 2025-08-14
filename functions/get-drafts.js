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

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const result = await client.query(
      q.Map(
        q.Paginate(
          q.Match(q.Index('drafts_by_user'), user.sub)
        ),
        q.Lambda('ref', q.Get(q.Var('ref')))
      )
    );

    const drafts = result.data.map(item => ({
      id: item.ref.id,
      ...item.data
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(drafts)
    };

  } catch (error) {
    console.error('Error getting drafts:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to get drafts" })
    };
  }
};
