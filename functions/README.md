# Netlify Functions for Blog Management

This directory contains serverless functions for managing blog posts and drafts securely.

## Setup Instructions

1. **Deploy to Netlify**: 
   - Connect your GitHub repository to Netlify
   - Set the publish directory to `page/`
   - Enable Netlify Identity for authentication

2. **Enable Netlify Identity**:
   - Go to Site Settings > Identity
   - Enable Identity service
   - Set registration to "Invite only"
   - Enable Git Gateway for authenticated users

3. **Configure Environment Variables**:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_REPO=your_username/your_repo_name
   GITHUB_BRANCH=main
   ```

4. **Authentication Setup**:
   - Invite yourself as a user in Netlify Identity
   - Use the editor interface which will be protected
   - Only authenticated users can create/edit posts

## API Endpoints

Once deployed, these functions will be available:

- `/.netlify/functions/save-post` - Save a new blog post
- `/.netlify/functions/save-draft` - Save a draft
- `/.netlify/functions/get-drafts` - Get user's drafts
- `/.netlify/functions/delete-draft` - Delete a draft

## Security

- Posts are saved to your GitHub repository via the GitHub API
- Drafts are stored in Netlify's database tied to user identity
- Only authenticated users can modify content
- Public visitors can only read published posts
