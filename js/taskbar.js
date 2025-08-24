// js/taskbar.js
import { toggleTheme } from './themer.js';
import * as editor from './editor.js';
import { renderSitemap } from './ui.js';

// A helper to check if we are on the editor page
const isEditorPage = !!document.getElementById('visualEditor');

const siteMenu = [
    {
        label: 'File',
        items: [
            { label: 'New Post', action: () => { window.location.href = 'editor.html'; } },
            { type: 'separator' },
            { label: 'About', action: () => { window.location.href = '?post=about'; } },
            { label: 'Contact', action: () => { window.location.href = '?post=contact'; } },
        ]
    },
    {
        label: 'View',
        items: [
            { label: 'Toggle Theme', action: toggleTheme },
        ]
    },
    {
        label: 'Projects',
        items: [
             // This can be populated dynamically from projects.json later
            { label: 'View All Projects', action: () => { console.log('View all projects'); } },
        ]
    },
    {
        label: 'Socials',
        items: [
             // Replace with your actual social media links
            { label: 'GitHub', action: () => window.open('https://github.com/your-username', '_blank') },
            { label: 'Twitter', action: () => window.open('https://twitter.com/your-username', '_blank') },
        ]
    },
    {
        label: 'Sitemap',
        action: renderSitemap
    }
];

const editorMenu = [
    {
        label: 'File',
        items: [
            { label: 'Publish Post', action: () => editor.editorActions.publish() },
            { type: 'separator' },
            { label: 'Back to Site', action: () => { window.location.href = 'index.html'; } },
        ]
    },
    {
        label: 'Connect',
        items: [
            { label: 'Setup GitHub', action: () => editor.editorActions.showGitHubModal() },
        ]
    },
    {
        label: 'View',
        items: [
            { label: 'Toggle Theme', action: toggleTheme },
        ]
    }
];

const menuConfig = isEditorPage ? editorMenu : siteMenu;

function renderMenuItem(item) {
    if (item.type === 'separator') {
        return '<div class="menu-separator"></div>';
    }
    const link = document.createElement('a');
    link.href = '#';

    if (item.action && !item.items) {
        link.className = 'label';
    } else {
        link.className = 'menu-entry';
    }
    
    link.textContent = item.label;
    link.onclick = (e) => {
        e.preventDefault();
        const parentMenuItem = link.closest('.menu-item');
        if (parentMenuItem) {
            parentMenuItem.classList.remove('open');
        }
        if (item.action) {
            item.action();
        }
    };
    return link.outerHTML;
}

function renderDropdown(menu) {
    if (menu.action && !menu.items) {
        return `
            <div class="menu-item">
                ${renderMenuItem(menu)}
            </div>
        `;
    }

    return `
        <div class="menu-item">
            <span class="label">${menu.label}</span>
            <div class="menu-dropdown">
                ${menu.items.map(renderMenuItem).join('')}
            </div>
        </div>
    `;
}

export function renderTaskbar() {
    const taskbarContainer = document.getElementById('taskbar-container');
    if (!taskbarContainer) return;

    const taskbarHTML = `
        <div class="menu-bar">
            <div class="menu-bar-inner">
                ${menuConfig.map(renderDropdown).join('')}
            </div>
        </div>
    `;
    taskbarContainer.innerHTML = taskbarHTML;

    // Add event listeners for showing/hiding dropdowns
    document.querySelectorAll('.menu-item > .label').forEach(label => {
        label.addEventListener('click', (e) => {
            const parent = label.parentElement;
            if (!parent.querySelector('.menu-dropdown')) return; // Not a dropdown menu

            const isOpen = parent.classList.contains('open');
            
            // Close all other dropdowns
            document.querySelectorAll('.menu-item.open').forEach(openItem => {
                openItem.classList.remove('open');
            });

            if (!isOpen) {
                parent.classList.add('open');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-item')) {
            document.querySelectorAll('.menu-item.open').forEach(openItem => {
                openItem.classList.remove('open');
            });
        }
    });
}
