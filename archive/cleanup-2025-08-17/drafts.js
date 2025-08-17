// Drafts management functionality
class DraftsManager {
  constructor() {
    this.drafts = [];
    this.init();
  }

  async init() {
    await this.loadDrafts();
    this.renderDrafts();
    this.setupEventListeners();
  }

  async loadDrafts() {
    try {
      const response = await fetch('/.netlify/functions/get-drafts');
      if (response.ok) {
        this.drafts = await response.json();
      } else {
        console.error('Error loading drafts:', response.statusText);
        this.drafts = [];
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
      // Fallback to local data for development
      try {
        const response = await fetch('data/drafts.json');
        this.drafts = await response.json();
      } catch (fallbackError) {
        this.drafts = [];
      }
    }
  }

  renderDrafts() {
    const container = document.getElementById('drafts-list');
    if (!container) return;

    if (this.drafts.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--muted);">No drafts found.</p>';
      return;
    }

    container.innerHTML = this.drafts.map(draft => `
      <div class="draft-item" data-id="${draft.id}">
        <div class="draft-info">
          <div class="draft-title">${this.escapeHtml(draft.title)}</div>
          <div class="draft-preview">${this.escapeHtml(this.truncateText(draft.content, 120))}</div>
          <div class="draft-meta">
            Category: ${draft.category} | 
            Created: ${this.formatDate(draft.created)} | 
            Modified: ${this.formatDate(draft.modified)}
          </div>
        </div>
        <div class="draft-actions">
          <button class="draft-btn edit" onclick="draftsManager.editDraft('${draft.id}')">Edit</button>
          <button class="draft-btn delete" onclick="draftsManager.confirmDelete('${draft.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  editDraft(id) {
    const draft = this.drafts.find(d => d.id === id);
    if (draft) {
      // Store draft data in sessionStorage and redirect to editor
      sessionStorage.setItem('editingDraft', JSON.stringify(draft));
      window.location.href = 'editor.html';
    }
  }

  confirmDelete(id) {
    const modal = document.getElementById('deleteModal');
    const confirmBtn = document.getElementById('confirmDelete');
    
    // Remove any existing event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', () => {
      this.deleteDraft(id);
      modal.style.display = 'none';
    });
    
    modal.style.display = 'block';
  }

  async deleteDraft(id) {
    try {
      const response = await fetch('/.netlify/functions/delete-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id })
      });

      if (response.ok) {
        // Remove from local array
        this.drafts = this.drafts.filter(d => d.id !== id);
        this.renderDrafts();
        console.log('Draft deleted successfully');
      } else {
        const error = await response.json();
        console.error('Error deleting draft:', error);
        alert('Failed to delete draft. Please try again.');
      }
      
    } catch (error) {
      console.error('Error deleting draft:', error);
      // Fallback for development - remove locally
      this.drafts = this.drafts.filter(d => d.id !== id);
      this.renderDrafts();
      console.log('Draft deleted locally (development mode)');
    }

    this.draftToDelete = null;
  }

  setupEventListeners() {
    const deleteModal = document.getElementById('deleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    
    if (cancelDelete) {
      cancelDelete.addEventListener('click', () => {
        deleteModal.style.display = 'none';
      });
    }

    // Close modal when clicking outside
    if (deleteModal) {
      deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
          deleteModal.style.display = 'none';
        }
      });
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
}

// Initialize drafts manager when page loads
let draftsManager;
document.addEventListener('DOMContentLoaded', () => {
  draftsManager = new DraftsManager();
});
