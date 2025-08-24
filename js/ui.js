// js/ui.js
import { loadPost } from './post-loader.js';

// --- Corner Logo ---
export function initializeCornerLogo() {
    const cornerGif = document.getElementById('cornerGif');
    if (!cornerGif) return;

    // In a real app, this might come from a config file
    cornerGif.style.backgroundImage = `url('assets/piousPigeon_logo_bird-export.png')`;
}

// --- Hover Notes ---
export function initializeHoverNotes() {
    const hoverNote = document.getElementById('hoverNote');
    if (!hoverNote) return;

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.note-link');
        if (target && target.dataset.note) {
            hoverNote.textContent = target.dataset.note;
            hoverNote.style.display = 'block';
            positionNote(e);
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.note-link')) {
            hoverNote.style.display = 'none';
        }
    });

    document.addEventListener('mousemove', positionNote);

    function positionNote(e) {
        if (hoverNote.style.display === 'block') {
            hoverNote.style.left = `${e.clientX + 15}px`;
            hoverNote.style.top = `${e.clientY + 15}px`;
        }
    }
}

// --- Sitemap ---
async function fetchAllPosts() {
    // This is a simplified example. A real implementation might fetch a manifest file
    // or use the GitHub API to list all posts.
    // For now, we'll assume a known list of posts.
    const postIds = ['first-post', 'about', 'contact'];
    const posts = [];
    for (const id of postIds) {
        try {
            const res = await fetch(`posts/${id}.json`);
            if (res.ok) {
                posts.push(await res.json());
            }
        } catch (error) {
            console.error(`Could not fetch post: ${id}`, error);
        }
    }
    return posts;
}

export async function renderSitemap() {
    const contentArea = document.getElementById('post-content');
    const titleArea = document.getElementById('post-title');
    if (!contentArea || !titleArea) return;

    titleArea.textContent = 'Sitemap';
    document.getElementById('post-date').textContent = '';
    contentArea.innerHTML = '<em>Loading sitemap...</em>';

    const posts = await fetchAllPosts();
    if (posts.length === 0) {
        contentArea.innerHTML = '<p>No posts found.</p>';
        return;
    }

    const postsByCategory = posts.reduce((acc, post) => {
        const category = post.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(post);
        return acc;
    }, {});

    let sitemapHTML = '';
    for (const category in postsByCategory) {
        sitemapHTML += `<h3 class="sitemap-category">${category}</h3><ul>`;
        postsByCategory[category].forEach(post => {
            // Generate a file name from title to link to the post
            const postLink = `?post=${post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}`;
            sitemapHTML += `<li><a href="${postLink}">${post.title}</a></li>`;
        });
        sitemapHTML += `</ul>`;
    }
    contentArea.innerHTML = sitemapHTML;
}
