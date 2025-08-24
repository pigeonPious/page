// js/themer.js

let currentTheme = 'light';

// Function to set the theme on the body and save to localStorage
function applyTheme(theme) {
    document.body.className = `${theme}-mode`;
    localStorage.setItem('blog-theme', theme);
    currentTheme = theme;
}

// Function to toggle between light and dark themes
export function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

// Function to initialize the theme from localStorage or default to light
export function initializeTheme() {
    const savedTheme = localStorage.getItem('blog-theme') || 'light';
    applyTheme(savedTheme);
}
