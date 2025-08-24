// js/github.js

const GITHUB_API_URL = 'https://api.github.com';

// --- Configuration ---
let config = {
    token: null,
    repo: null,
    branch: 'main',
};

export function loadGitHubConfig() {
    const savedConfig = localStorage.getItem('github-config');
    if (savedConfig) {
        config = JSON.parse(savedConfig);
    }
    return config;
}

export function saveGitHubConfig(token, repo, branch = 'main') {
    config = { token, repo, branch };
    localStorage.setItem('github-config', JSON.stringify(config));
}

// --- API Functions ---

// Publish a post to GitHub
export async function publishPost(fileName, content) {
    if (!config.token || !config.repo) {
        throw new Error('GitHub configuration is not set.');
    }

    const url = `${GITHUB_API_URL}/repos/${config.repo}/contents/posts/${fileName}`;
    
    // btoa is used to base64-encode the content
    const encodedContent = btoa(content);

    const body = {
        message: `New post: ${fileName}`,
        content: encodedContent,
        branch: config.branch,
    };

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${config.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${errorData.message}`);
    }

    return await response.json();
}
