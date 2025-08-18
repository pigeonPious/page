/**
 * Editor Module - Simplified for button functionality
 * Handles all editor functionality including publishing, exporting, and keywords
 */

const EditorModule = () => ({
  currentKeywords: 'general',
  authToken: null,
  
  async init() {
    console.log('Initializing Editor module...');
    
    // Only initialize if we're on the editor page
    if (!document.getElementById('visualEditor')) {
      console.log('Not on editor page, skipping editor initialization');
      return;
    }
    
    // Create global editor instance for HTML onclick handlers
    window.editorInstance = this;
    window.editor = this; // Also create 'editor' alias for compatibility
    
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Additional delay to ensure all elements are rendered
    setTimeout(() => {
      this.setupEditorButtons();
    }, 500);
  },

  setupEditorButtons() {
    console.log('Setting up editor buttons...');
    
    // FLAGS button
    const flagsBtn = document.getElementById('keywords-btn');
    if (flagsBtn) {
      flagsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showKeywordsModal();
      });
      console.log('✅ FLAGS button connected');
    } else {
      console.log('❌ FLAGS button not found');
    }

    // IMAGES button
    const imagesBtn = document.getElementById('images-btn');
    if (imagesBtn) {
      imagesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showImagesModal();
      });
      console.log('✅ IMAGES button connected');
    } else {
      console.log('❌ IMAGES button not found');
    }

    // EXPORT button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.exportPost();
      });
      console.log('✅ EXPORT button connected');
    } else {
      console.log('❌ EXPORT button not found');
    }

    // PUBLISH button
    const publishBtn = document.getElementById('publish-btn');
    if (publishBtn) {
      publishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.publishPost();
      });
      console.log('✅ PUBLISH button connected');
    } else {
      console.log('❌ PUBLISH button not found');
    }

    console.log('Editor buttons setup completed');
  },

  showKeywordsModal() {
    console.log('FLAGS button clicked - showing keywords modal');
    
    const modal = document.getElementById('keywordsModal');
    if (modal) {
      modal.style.display = 'block';
      
      // Focus on input
      const input = document.getElementById('keywords-input');
      if (input) {
        input.focus();
        // Set current keywords if any
        input.value = this.currentKeywords || 'general';
      }
    } else {
      alert('Keywords modal not found. Add flags/keywords functionality coming soon!');
    }
  },

  showImagesModal() {
    console.log('IMAGES button clicked - showing images modal');
    alert('Image upload functionality coming soon!');
  },

  exportPost() {
    console.log('EXPORT button clicked - exporting post');
    
    const title = document.getElementById('postTitle');
    const editor = document.getElementById('visualEditor');
    
    if (!editor || !editor.innerHTML.trim()) {
      alert('Please write some content before exporting.');
      return;
    }

    const titleText = title ? title.value || 'Untitled Post' : 'Untitled Post';
    const content = editor.innerHTML;
    
    // Create a simple text export
    const exportContent = `Title: ${titleText}\n\nContent:\n${content}`;
    
    // Create download
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titleText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Post exported successfully!');
  },

  publishPost() {
    console.log('PUBLISH button clicked - publishing post');
    
    const title = document.getElementById('postTitle');
    const editor = document.getElementById('visualEditor');
    
    if (!editor || !editor.innerHTML.trim()) {
      alert('Please write some content before publishing.');
      return;
    }

    const titleText = title ? title.value || 'Untitled Post' : 'Untitled Post';
    
    // For now, just show success message
    alert(`Post "${titleText}" ready to publish!\n\n(Full publish functionality requires authentication)`);
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  },

  saveKeywords() {
    const input = document.getElementById('keywords-input');
    if (input) {
      this.currentKeywords = input.value || 'general';
      console.log('Keywords saved:', this.currentKeywords);
    }
    this.closeModal('keywordsModal');
  }
});

// Export for global access
if (typeof window !== 'undefined') {
  window.EditorModule = EditorModule;
}
