document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    checkAdminStatus();
    initializeTheme();
    document.getElementById('home-link').addEventListener('click', (e) => {
        e.preventDefault();
        loadPosts();
    });
    document.getElementById('sitemap-link').addEventListener('click', renderSitemap);
});

let allPosts = []; // To store fetched posts

async function loadPosts() {
    const contentArea = document.getElementById('content');
    contentArea.innerHTML = '';

    // --- Configuration ---
    // IMPORTANT: Replace with your GitHub username and repository name.
    const GITHUB_USER = 'your-username';
    const GITHUB_REPO = 'your-repo-name';
    // -------------------

    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/posts`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // If the posts directory doesn't exist yet, just show the welcome post locally.
            if (response.status === 404) {
                console.warn("Posts directory not found in repo. Loading local welcome post.");
                const welcomeResponse = await fetch('posts/welcome.json');
                if (welcomeResponse.ok) {
                    renderPost(await welcomeResponse.json());
                }
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const files = await response.json();
        allPosts = []; // Clear previous posts

        if (files.length === 0) {
            contentArea.innerHTML = '<p>No posts found.</p>';
            return;
        }

        // Sort files by name (assuming date-based naming or alphabetical)
        files.sort((a, b) => b.name.localeCompare(a.name)); 

        for (const file of files) {
            if (file.type === 'file' && file.name.endsWith('.json')) {
                const postResponse = await fetch(file.download_url);
                if (postResponse.ok) {
                    const post = await postResponse.json();
                    allPosts.push(post); // Store post
                    renderPost(post);
                }
            }
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        contentArea.innerHTML = '<p>Could not load posts. See console for details.</p>';
    }
}

function renderPost(post) {
    const contentArea = document.getElementById('content');

    const postElement = document.createElement('article');
    postElement.className = 'post';

    postElement.innerHTML = `
        <header class="post-header">
            <h2 class="post-title">${post.title}</h2>
            <p class="post-meta">
                Posted on <time datetime="${post.date}">${post.date}</time>
                by ${post.author} in <span class="post-category">${post.category}</span>
            </p>
        </header>
        <div class="post-content">
            ${post.content}
        </div>
    `;

    contentArea.appendChild(postElement);
}

function renderSitemap(e) {
    if (e) e.preventDefault();

    const contentArea = document.getElementById('content');
    contentArea.innerHTML = '<h2>Sitemap</h2>';

    if (allPosts.length === 0) {
        contentArea.innerHTML += '<p>No posts to display in the sitemap.</p>';
        return;
    }

    const postsByCategory = allPosts.reduce((acc, post) => {
        const category = post.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(post);
        return acc;
    }, {});

    for (const category in postsByCategory) {
        const categorySection = document.createElement('div');
        categorySection.className = 'sitemap-category';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category;
        categorySection.appendChild(categoryTitle);

        const postList = document.createElement('ul');
        postsByCategory[category].forEach(post => {
            const postItem = document.createElement('li');
            // This is a simple link for now. In a full SPA, we'd handle this differently.
            postItem.innerHTML = `<a href="#">${post.title}</a> <span class="sitemap-date">(${post.date})</span>`;
            postList.appendChild(postItem);
        });
        categorySection.appendChild(postList);
        contentArea.appendChild(categorySection);
    }
}

// --- Admin ---
const state = {
    isAdmin: false,
    githubToken: null
};

function login(token) {
    if (!token) {
        console.error("Login requires a GitHub Personal Access Token.");
        return;
    }
    state.githubToken = token;
    state.isAdmin = true;
    localStorage.setItem('githubToken', token);
    console.log("Logged in as admin.");
    updateAdminUI();
}

function logout() {
    state.githubToken = null;
    state.isAdmin = false;
    localStorage.removeItem('githubToken');
    console.log("Logged out.");
    updateAdminUI();
}

function checkAdminStatus() {
    const token = localStorage.getItem('githubToken');
    if (token) {
        state.githubToken = token;
        state.isAdmin = true;
        console.log("Admin status checked. You are logged in.");
    } else {
        console.log("Admin status checked. You are not logged in. Use login('YOUR_TOKEN') to log in.");
    }
    updateAdminUI();
}

function updateAdminUI() {
    const adminControls = document.getElementById('admin-controls');
    if (state.isAdmin) {
        adminControls.style.display = 'block';
        document.getElementById('new-post-btn').addEventListener('click', openEditor);
        document.getElementById('image-magazine-btn').addEventListener('click', openImageMagazine);
    } else {
        adminControls.style.display = 'none';
    }
}

function openEditor(post = null) {
    const modal = document.getElementById('editor-modal');
    modal.style.display = 'flex';

    // I will add logic to populate the editor with post data for editing later.

    document.querySelector('#editor-modal .close-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('post-form').onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value;
        
        await savePost(title, category, content);
        
        modal.style.display = 'none';
        document.getElementById('post-form').reset();
    };
}

function openImageMagazine() {
    const modal = document.getElementById('image-magazine-modal');
    modal.style.display = 'flex';

    document.querySelector('#image-magazine-modal .close-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    loadImages();

    document.getElementById('upload-image-btn').onclick = uploadImage;
}

async function loadImages() {
    const gallery = document.getElementById('image-gallery');
    gallery.innerHTML = '<em>Loading images...</em>';

    // --- Configuration ---
    const GITHUB_USER = 'your-username';
    const GITHUB_REPO = 'your-repo-name';
    // -------------------

    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets`;

    try {
        const response = await fetch(url);
        if (response.status === 404) {
            gallery.innerHTML = '<p>No images found. Upload one to get started!</p>';
            return;
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const files = await response.json();
        const imageFiles = files.filter(file => file.type === 'file' && /\.(jpg|jpeg|png|gif)$/i.test(file.name));

        if (imageFiles.length === 0) {
            gallery.innerHTML = '<p>No images found. Upload one to get started!</p>';
        } else {
            gallery.innerHTML = '';
            imageFiles.forEach(file => {
                const img = document.createElement('img');
                img.src = file.download_url;
                img.alt = file.name;
                img.onclick = () => {
                    navigator.clipboard.writeText(`![](${file.download_url})`);
                    alert('Image Markdown copied to clipboard!');
                };
                gallery.appendChild(img);
            });
        }
    } catch (error) {
        console.error('Error loading images:', error);
        gallery.innerHTML = '<p>Could not load images.</p>';
    }
}

async function uploadImage() {
    if (!state.isAdmin || !state.githubToken) {
        alert("You must be an admin to upload images.");
        return;
    }

    const input = document.getElementById('image-upload-input');
    if (input.files.length === 0) {
        alert("Please select a file to upload.");
        return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const content = e.target.result.split(',')[1]; // Base64 content

        // --- Configuration ---
        const GITHUB_USER = 'your-username';
        const GITHUB_REPO = 'your-repo-name';
        // -------------------

        const filePath = `assets/${file.name}`;
        const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filePath}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${state.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
                body: JSON.stringify({
                    message: `Upload image: ${file.name}`,
                    content: content,
                    branch: 'main'
                }),
            });

            if (response.ok) {
                alert('Image uploaded successfully!');
                loadImages(); // Refresh gallery
                input.value = ''; // Reset input
            } else {
                const error = await response.json();
                alert(`Error uploading image: ${error.message}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('An error occurred during upload. See console for details.');
        }
    };

    reader.readAsDataURL(file);
}

// --- Theme ---
function initializeTheme() {
    const themeSelect = document.getElementById('theme-select');
    const currentTheme = localStorage.getItem('theme') || 'light';

    document.body.className = `${currentTheme}-mode`;
    themeSelect.value = currentTheme;

    themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
    });
}

function setTheme(theme) {
    document.body.className = `${theme}-mode`;
    localStorage.setItem('theme', theme);
}

async function savePost(title, category, content) {
    if (!state.isAdmin || !state.githubToken) {
        console.error("You must be logged in as an admin to save posts.");
        return;
    }

    // --- Configuration ---
    // IMPORTANT: Replace with your GitHub username and repository name.
    const GITHUB_USER = 'your-username';
    const GITHUB_REPO = 'your-repo-name';
    // -------------------

    const fileName = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + '.json';
    const filePath = `posts/${fileName}`;

    const postData = {
        title,
        category,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        author: "Admin", // Or get from GitHub user info later
        content
    };

    const fileContent = JSON.stringify(postData, null, 4);
    const encodedContent = btoa(fileContent);

    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filePath}`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${state.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Create new post: ${title}`,
                content: encodedContent,
                branch: 'main' // Or your default branch
            }),
        });

        if (response.ok) {
            console.log('Post saved successfully!');
            // Reload posts to show the new one
            loadPosts(); 
        } else {
            const error = await response.json();
            console.error('Error saving post:', error.message);
            alert(`Error saving post: ${error.message}`);
        }
    } catch (error) {
        console.error('Network or other error:', error);
        alert('An error occurred while saving the post. See the console for details.');
    }
}

// Check admin status on page load is now handled at the top
