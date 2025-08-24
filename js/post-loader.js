// js/post-loader.js

// Function to get post ID from URL query string
function getPostIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('post') || 'first-post'; // Default to 'first-post'
}

// Function to fetch and render a post
export async function loadPost() {
    const postId = getPostIdFromUrl();
    if (!postId) {
        document.getElementById('post-title').textContent = "Welcome";
        document.getElementById('post-content').innerHTML = "<p>Please select a post to read.</p>";
        return;
    }

    try {
        const response = await fetch(`posts/${postId}.json`);
        if (!response.ok) {
            throw new Error(`Post not found: ${postId}`);
        }
        const post = await response.json();

        // Populate the content fields
        document.getElementById('post-title').textContent = post.title;
        document.getElementById('post-date').textContent = post.date;

        // Simple markdown to HTML conversion for notes
        let contentHTML = post.content;
        contentHTML = contentHTML.replace(/\[\[(.*?)\]\]/g, '<span class="note-link" data-note="$1">$1</span>');
        
        document.getElementById('post-content').innerHTML = contentHTML;

        // Update the document title
        document.title = post.title;

    } catch (error) {
        console.error("Error loading post:", error);
        document.getElementById('post-title').textContent = "Error";
        document.getElementById('post-content').innerHTML = `<p>Sorry, the post could not be loaded. ${error.message}</p>`;
    }
}
