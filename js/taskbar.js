// js/taskbar.js
import { toggleTheme } from './themer.js';
import * as editor from './editor.js';

const isEditorPage = !!document.getElementById('visualEditor');

const siteMenu = [
    {
        label: 'File',
        items: [
            { label: 'New Post', action: () => { window.location.href = 'editor.html'; } },
        ]
    },
    {
        label: 'View',
        items: [
            { label: 'Toggle Theme', action: toggleTheme },
        ]
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
    link.className = 'menu-entry';
    link.textContent = item.label;
    link.onclick = (e) => {
        e.preventDefault();
        if (item.action) {
            item.action();
        }
    };
    return link.outerHTML;
}

function renderDropdown(menu) {
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
    document.querySelectorAll('.menu-item').forEach(item => {
        const label = item.querySelector('.label');
        const dropdown = item.querySelector('.menu-dropdown');
        
        label.addEventListener('click', (e) => {
            const isOpen = item.classList.contains('open');
            // Close all other dropdowns
            document.querySelectorAll('.menu-item.open').forEach(openItem => {
                openItem.classList.remove('open');
            });
            if (!isOpen) {
                item.classList.add('open');
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
