// js/editor.js
import { debounce } from './utils.js';
import * as github from './github.js';

const titleInput = document.getElementById('postTitle');
const contentEditor = document.getElementById('visualEditor');
const githubModal = document.getElementById('githubModal');

// --- Draft Management ---

// Save the current content to localStorage
function saveDraft() {
    if (!titleInput || !contentEditor) return;

    const draft = {
        title: titleInput.value,
        content: contentEditor.innerHTML,
        lastModified: new Date().toISOString(),
    };
    localStorage.setItem('editor-draft', JSON.stringify(draft));
    console.log('Draft saved.');
}

// Load the last draft from localStorage
function loadDraft() {
    if (!titleInput || !contentEditor) return;

    const draftString = localStorage.getItem('editor-draft');
    if (draftString) {
        const draft = JSON.parse(draftString);
        titleInput.value = draft.title;
        contentEditor.innerHTML = draft.content;
        console.log('Draft loaded.');
    }
}

// --- Initialization ---

export function initializeEditor() {
    if (!document.getElementById('visualEditor')) {
        // Not on the editor page
        return;
    }
    
    console.log('Initializing editor...');

    loadDraft();

    // Auto-save draft on input, using a debounce to limit frequency
    const debouncedSave = debounce(saveDraft, 500);
    titleInput.addEventListener('input', debouncedSave);
    contentEditor.addEventListener('input', debouncedSave);
}

// --- Publishing ---
async function publish() {
    const title = titleInput.value.trim();
    const content = contentEditor.innerHTML;

    if (!title) {
        alert('Please enter a title before publishing.');
        return;
    }

    // Generate a filename from the title
    const fileName = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + '.json';

    const postData = {
        title,
        date: new Date().toISOString().split('T')[0],
        content,
        // I will add category/flags later
    };
    
    try {
        await github.publishPost(fileName, JSON.stringify(postData, null, 2));
        alert('Post published successfully!');
        // Clear the draft after successful publish
        localStorage.removeItem('editor-draft');
    } catch (error) {
        console.error('Publishing error:', error);
        alert(`Failed to publish post: ${error.message}`);
    }
}

// --- GitHub Config Modal ---
function showGitHubModal() {
    if (githubModal) {
        githubModal.style.display = 'flex';

        // Populate with saved config
        const config = github.loadGitHubConfig();
        document.getElementById('github-token').value = config.token || '';
        document.getElementById('github-repo').value = config.repo || '';
        document.getElementById('github-branch').value = config.branch || 'main';
        
        // Add save and close handlers
        githubModal.querySelector('.primary').onclick = () => {
            const token = document.getElementById('github-token').value;
            const repo = document.getElementById('github-repo').value;
            const branch = document.getElementById('github-branch').value;
            github.saveGitHubConfig(token, repo, branch);
            githubModal.style.display = 'none';
        };

        // I'm assuming a generic close button, you might need to adjust selectors
        githubModal.querySelector('.btn:not(.primary)').onclick = () => {
            githubModal.style.display = 'none';
        };
    }
}

// Add this to your taskbar config in taskbar.js where appropriate
export const editorActions = {
    publish,
    showGitHubModal
};
