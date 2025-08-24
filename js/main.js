// Main entry point for the application
import { loadPost } from './post-loader.js';
import { renderTaskbar } from './taskbar.js';
import { initializeTheme } from './themer.js';
import { initializeEditor } from './editor.js';
import { initializeCornerLogo, initializeHoverNotes } from './ui.js';

function initialize() {
    console.log("Initializing Application...");
    
    initializeTheme();
    renderTaskbar();

    // Check which page we're on and initialize accordingly
    if (document.getElementById('post-content')) {
        loadPost();
        initializeCornerLogo();
        initializeHoverNotes();
    } else if (document.getElementById('visualEditor')) {
        initializeEditor();
    }
    
    // Other initializations will go here
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initialize);
