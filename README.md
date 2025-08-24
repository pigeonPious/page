# PPPage - Simple Blog System

A simplified blog system that reads posts from .txt files and displays them with hover notes and embedded images.

## Features

- **Simple .txt Post Format**: Write posts in plain text with automatic metadata parsing
- **Hover Notes**: Use `[DISPLAY TEXT:HOVERNOTE CONTENT HERE]` syntax for interactive tooltips
- **Image Embedding**: Use `[IMAGE]` syntax to automatically embed images from post folders
- **Live Sitemap**: Automatically discovers and displays all posts from the GitHub repository
- **View Menu**: Dark/light theme switching and custom color schemes
- **No Editor**: Posts are managed by uploading .txt files directly to GitHub

## Post Format

Posts are written in .txt files with the following structure:

```
# Post Title

Date: 2025-01-30
Keywords: category1, category2

Post content goes here.

## Section Headers

You can use markdown-style headers.

### Subsection

[Hover over this:This is a hover note!]

[IMAGE]

More content with another image.

[IMAGE]
```

### Metadata

- **Title**: First line starting with `#` or first non-empty line
- **Date**: Line starting with `Date:` (defaults to today if not specified)
- **Keywords**: Line starting with `Keywords:` (used for categorization)
- **Content**: Everything after metadata or after 10 lines

### Hover Notes

Use the syntax `[DISPLAY TEXT:HOVERNOTE CONTENT HERE]` to create interactive tooltips.

### Images

1. Use `[IMAGE]` in your .txt file where you want an image
2. Create a folder with the same name as your post in the `posts/` directory
3. Upload images to that folder
4. The system will automatically:
   - Load the first `[IMAGE]` with the first image found
   - Load the second `[IMAGE]` with the second image found
   - If there are more `[IMAGE]` calls than images, randomly select from available images

## File Structure

```
page/
├── index.html          # Main page
├── site.js            # Site functionality
├── style.css          # Styling
├── posts/             # Post directory
│   ├── sample-post.txt
│   └── sample-post/   # Images for sample-post
└── assets/            # Site assets
```

## Usage

1. **View Posts**: Navigate using the sitemap or navigation menu
2. **Add Posts**: Upload .txt files to the `posts/` directory on GitHub
3. **Add Images**: Create a folder with the same name as your post and upload images
4. **Customize**: Modify `style.css` for custom themes

## Navigation

- **Star Button**: Toggle sitemap
- **Navigation Menu**: Browse posts by category
- **View Menu**: Switch between themes
- **Console**: Access developer tools with `Ctrl+Shift+I`

## Technical Details

- **Post Discovery**: Uses GitHub's public directory browsing to find .txt files
- **Image Loading**: Automatically discovers images in post folders
- **Hover Notes**: Built-in tooltip system with custom syntax
- **Responsive**: Works on desktop and mobile devices
- **No Backend**: Pure frontend solution using GitHub as content storage

## Example Post

See `posts/sample-post.txt` for a complete example of the new format.
