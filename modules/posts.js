/**
 * Posts Management Module
 * Handles all post loading, displaying, and navigation
 */

const PostsModule = () => ({
  posts: [],
  categorizedPosts: {},
  currentPost: null,

  async init() {
    ppPage.log('Initializing Posts module...');
    await this.loadPosts();
    this.setupPostDisplay();
  },

  async loadPosts() {
    try {
      ppPage.log('Loading posts from index...');
      
      const url = ppPage.utils.cacheBustUrl('posts/index.json');
      const response = await ppPage.utils.fetch(url);
      const posts = await response.json();
      
      if (!posts || posts.length === 0) {
        ppPage.log('No posts found in index.json', 'warning');
        return;
      }

      // Sort posts by date (most recent first)
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      this.posts = posts;
      this.categorizesPosts();
      
      ppPage.log(`Loaded ${posts.length} posts successfully`);
      
      // Auto-load first post if on main page
      if (this.shouldAutoLoadPost()) {
        await this.loadPost(posts[0].slug);
      }
      
      return posts;
      
    } catch (error) {
      ppPage.log(`Error loading posts: ${error.message}`, 'error');
      throw error;
    }
  },

  categorizesPosts() {
    this.categorizedPosts = {};
    
    this.posts.forEach(post => {
      const category = post.category || 'general';
      if (!this.categorizedPosts[category]) {
        this.categorizedPosts[category] = [];
      }
      this.categorizedPosts[category].push(post);
    });
  },

  shouldAutoLoadPost() {
    // Only auto-load posts on main page (has post-content element)
    return !!ppPage.utils.getElement('#post-content');
  },

  async loadPost(slug) {
    try {
      ppPage.log(`Loading post: ${slug}`);
      
      const url = ppPage.utils.cacheBustUrl(`posts/${slug}.json`);
      const response = await ppPage.utils.fetch(url);
      const post = await response.json();
      
      this.currentPost = post;
      this.displayPost(post);
      
      ppPage.log(`Post '${post.title}' loaded successfully`);
      return post;
      
    } catch (error) {
      ppPage.log(`Error loading post '${slug}': ${error.message}`, 'error');
      throw error;
    }
  },

  displayPost(post) {
    // Update post display elements safely
    const elements = {
      title: ppPage.utils.getElement('#post-title'),
      date: ppPage.utils.getElement('#post-date'),
      content: ppPage.utils.getElement('#post-content')
    };

    if (elements.title) {
      elements.title.textContent = post.title;
    }
    
    if (elements.date) {
      elements.date.textContent = ppPage.utils.formatDate(post.date);
    }
    
    if (elements.content) {
      elements.content.innerHTML = post.content;
      
      // Setup image modal functionality for the new content
      this.setupImageModals(elements.content);
    }

    // Update page URL hash
    if (history.replaceState) {
      history.replaceState(null, null, `#${post.slug || ''}`);
    }
  },

  setupImageModals(container) {
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      ppPage.utils.addEvent(img, 'click', (e) => {
        e.preventDefault();
        this.showImageModal(img);
      });
    });
  },

  showImageModal(img) {
    // Create modal if it doesn't exist
    let modal = ppPage.utils.getElement('#image-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'image-modal';
      modal.innerHTML = `
        <div class="image-modal-backdrop">
          <div class="image-modal-content">
            <img src="" alt="">
            <button class="image-modal-close">&times;</button>
          </div>
        </div>
      `;
      
      // Add modal styles
      const styles = `
        #image-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
        }
        
        .image-modal-backdrop {
          background: rgba(0, 0, 0, 0.8);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .image-modal-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
        }
        
        .image-modal-content img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .image-modal-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 30px;
          cursor: pointer;
          padding: 5px;
        }
      `;
      
      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
      
      document.body.appendChild(modal);
      
      // Setup close handlers
      ppPage.utils.addEvent(modal.querySelector('.image-modal-close'), 'click', () => {
        this.closeImageModal();
      });
      
      ppPage.utils.addEvent(modal.querySelector('.image-modal-backdrop'), 'click', (e) => {
        if (e.target === e.currentTarget) {
          this.closeImageModal();
        }
      });
      
      ppPage.utils.addEvent(document, 'keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeImageModal();
        }
      });
    }
    
    // Show modal with image
    const modalImg = modal.querySelector('img');
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modal.style.display = 'block';
  },

  closeImageModal() {
    const modal = ppPage.utils.getElement('#image-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  setupPostDisplay() {
    // Setup image click handlers for existing content
    const existingContent = ppPage.utils.getElement('#post-content');
    if (existingContent) {
      this.setupImageModals(existingContent);
    }
  },

  // Public API methods
  getPostBySlug(slug) {
    return this.posts.find(post => post.slug === slug);
  },

  getPostsByCategory(category) {
    return this.categorizedPosts[category] || [];
  },

  getRandomPost() {
    if (this.posts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.posts.length);
    return this.posts[randomIndex];
  },

  getMostRecentPost() {
    return this.posts[0] || null;
  },

  getAllPosts() {
    return [...this.posts];
  },

  getCategorizedPosts() {
    return { ...this.categorizedPosts };
  },

  // Navigation methods for taskbar buttons
  async loadLatestPost() {
    ppPage.log('Loading latest post...');
    if (this.posts.length === 0) {
      ppPage.log('No posts available', 'warning');
      return;
    }
    
    const latestPost = this.posts[0]; // Posts are sorted by date, most recent first
    await this.loadPost(latestPost.slug);
    ppPage.log(`Loaded latest post: ${latestPost.title}`);
  },

  async loadRandomPost() {
    ppPage.log('Loading random post...');
    if (this.posts.length === 0) {
      ppPage.log('No posts available', 'warning');
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * this.posts.length);
    const randomPost = this.posts[randomIndex];
    await this.loadPost(randomPost.slug);
    ppPage.log(`Loaded random post: ${randomPost.title}`);
  },

  async loadMostRecentPost() {
    // Same as loadLatestPost for now
    return this.loadLatestPost();
  }
});

// Export the module factory
if (typeof window !== 'undefined') {
  window.PostsModule = PostsModule;
}
