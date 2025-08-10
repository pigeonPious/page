
# Left-like Blog (GitHub Pages)

A Jekyll blog styled to look like a minimalist Linux text editor window.

## Use
1. Download and unzip.
2. Push the folder to a GitHub repository named `<username>.github.io` (or any repo and set GitHub Pages to build from the `main` branch).
3. Visit your Pages URL. Menus:
   - **File** / **Edit**: placeholder entries (non-functional).
   - **Navigation**: About, Contact, Blog.
   - **View**: toggles Light/Dark (stored in localStorage).
   - **Log**: lists all posts.

## New posts
Create a new file in `_posts` named `YYYY-MM-DD-title.md` with front matter:

```yaml
---
title: "Your Title"
date: 2025-08-10
---
```

Then write in Markdown. To add images, put files in `assets/images/` and use:

```md
![alt text](/assets/images/your-image.png)
```
Images float right and are smaller than the text width by default.
