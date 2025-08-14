const { Octokit } = require("@octokit/rest");

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
    const { category } = JSON.parse(event.body);
    
    if (!category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Category name is required" })
      };
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    const branch = process.env.GITHUB_BRANCH || 'main';
    
    // Get current categories
    let categories;
    try {
      const { data: categoriesFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'page/data/categories.json',
        ref: branch
      });
      categories = JSON.parse(Buffer.from(categoriesFile.content, 'base64').toString());
    } catch (error) {
      // File doesn't exist, create new array
      categories = ['general'];
    }

    // Add new category if not exists
    if (!categories.includes(category)) {
      categories.push(category);
      
      // Save updated categories
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: 'page/data/categories.json',
        message: `Add category: ${category}`,
        content: Buffer.from(JSON.stringify(categories, null, 2)).toString('base64'),
        sha: categoriesFile ? categoriesFile.sha : undefined,
        branch
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, categories })
    };

  } catch (error) {
    console.error('Error saving category:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save category" })
    };
  }
};
