const { Octokit } = require("@octokit/rest");

exports.handler = async (event, context) => {
  // Check if user is authenticated
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
    const { title, content, category, slug } = JSON.parse(event.body);
    
    if (!title || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Title and content are required" })
      };
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    const branch = process.env.GITHUB_BRANCH || 'main';
    
    // Create post data
    const date = new Date().toISOString().split('T')[0];
    const formattedDate = formatDateForPost(date);
    
    const postData = {
      title,
      date: formattedDate,
      content,
      category: category || 'general'
    };

    // Save post file
    const postPath = `page/posts/${slug}.json`;
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: postPath,
      message: `Add post: ${title}`,
      content: Buffer.from(JSON.stringify(postData, null, 2)).toString('base64'),
      branch
    });

    // Update index
    const { data: indexFile } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'page/posts/index.json',
      ref: branch
    });

    const indexContent = JSON.parse(Buffer.from(indexFile.content, 'base64').toString());
    indexContent.push({
      slug,
      title,
      date: formattedDate,
      category: category || 'general'
    });

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'page/posts/index.json',
      message: `Update index for post: ${title}`,
      content: Buffer.from(JSON.stringify(indexContent, null, 2)).toString('base64'),
      sha: indexFile.sha,
      branch
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, slug })
    };

  } catch (error) {
    console.error('Error saving post:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save post" })
    };
  }
};

function formatDateForPost(dateStr) {
  const date = new Date(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${date.getFullYear()}-${months[date.getMonth()]}-${date.getDate()}`;
}
