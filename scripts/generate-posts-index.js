#!/usr/bin/env node
/*
  Generate posts-index.json by scanning posts/**.txt
  - Supports nested subfolders
  - Co-located media policy is unaffected
*/

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

async function fileExists(p) {
  try { await fsp.access(p); return true; } catch { return false; }
}

async function walkDir(dir, out = []) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(full, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.txt')) {
      out.push(full);
    }
  }
  return out;
}

function parseFrontMatterLike(content) {
  const lines = content.split(/\r?\n/);
  let title = 'Untitled';
  let date = null;
  let keywords = '';
  let seenContent = false;
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!seenContent) {
      if (line.startsWith('# ')) { title = line.substring(2).trim(); continue; }
      if (line.toLowerCase().startsWith('title:')) { title = line.substring(line.indexOf(':') + 1).trim(); continue; }
      if (line.toLowerCase().startsWith('date:')) { date = line.substring(line.indexOf(':') + 1).trim(); continue; }
      if (line.toLowerCase().startsWith('keywords:')) { keywords = line.substring(line.indexOf(':') + 1).trim(); continue; }
      if (line === '' || line.startsWith('---')) { seenContent = true; continue; }
      if (title === 'Untitled' && line !== '') { title = line; }
    }
  }
  return { title, date, keywords };
}

function computeSlugFromRelativePath(relativePath) {
  const withoutExt = relativePath.replace(/\\/g, '/').replace(/\.txt$/i, '');
  const parts = withoutExt.split('/');
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const parent = parts[parts.length - 2];
    if (last === parent) {
      return parts.slice(0, parts.length - 1).join('/');
    }
  }
  return withoutExt;
}

(async () => {
  const repoRoot = path.resolve(__dirname, '..');
  const postsDir = path.join(repoRoot, 'posts');
  const indexPath = path.join(repoRoot, 'posts-index.json');

  if (!(await fileExists(postsDir))) {
    console.error('posts directory not found at', postsDir);
    process.exit(1);
  }

  const files = await walkDir(postsDir);
  const posts = [];

  for (const fullPath of files) {
    const relFromRoot = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
    const relFromPosts = path.relative(postsDir, fullPath).replace(/\\/g, '/');
    const stat = await fsp.stat(fullPath);
    const raw = await fsp.readFile(fullPath, 'utf8');
    const meta = parseFrontMatterLike(raw);
    const slug = computeSlugFromRelativePath(relFromPosts);

    // Date fallback to mtime (YYYY-MM-DD)
    const dateIso = (meta.date && meta.date.trim()) || new Date(stat.mtime).toISOString().split('T')[0];

    posts.push({
      slug,
      title: meta.title,
      date: dateIso,
      keywords: meta.keywords || '',
      filename: path.basename(fullPath),
      path: relFromPosts,
      last_modified: new Date(stat.mtime).toISOString()
    });
  }

  // Sort by date desc, then by slug
  posts.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (db !== da) return db - da;
    return (a.slug || '').localeCompare(b.slug || '');
  });

  const index = {
    generated_at: new Date().toISOString(),
    total_posts: posts.length,
    posts
  };

  await fsp.writeFile(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${posts.length} posts to`, path.relative(repoRoot, indexPath));
})();


