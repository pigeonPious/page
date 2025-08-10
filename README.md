# Minimal Notes (Jekyll)

**What you get**
- Minimal layout mixing “page” and a Linux editor gutter
- Tall, narrow center column; small title; generous top whitespace
- Left-edge vertical nav tabs; thin rules; typewriter-style font
- Post dropdown (open older posts) and an archive page
- Two sample posts + images

**Use**
1. Copy everything to your repo root.
2. Commit & push to `main`.
3. GitHub Pages will build automatically.
4. Home shows the latest post; use the dropdown or `/archive/` for older posts.

**New post**
Create `_posts/YYYY-MM-DD-title.md`:
```yaml
---
layout: minimal
title: "Post Title"
date: 2025-08-10 09:00:00 -0700
---
Content…
![Alt]({{ '/assets/img/my-img.png' | relative_url }})
```
