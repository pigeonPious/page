# Left-like Blog (GitHub Pages ready)

**Deploy**
1. Create a repo (either `YOUR-USER.github.io` for a user site, or any repo for a project site).
2. Upload these files to the repo root and commit.
3. In GitHub → Settings → Pages, set Pages to build from the `main` branch (or your default).

**Project site?** If your URL will be `https://YOUR-USER.github.io/your-repo/`, set in `_config.yml`:
```
baseurl: "/your-repo"
url: "https://YOUR-USER.github.io"
```

**Use in posts**

Right image with wrap-then-clear:
```html
<img class="float-right" src="{{ '/assets/images/your.jpg' | relative_url }}" alt="">
<p>Text will wrap next to the image height…</p>
<div class="clear-after"></div>
<p>Now below the image.</p>
```

Hover notes:
```html
<span class="note-link" data-note="Your note here">a word</span>
```

Corner GIF:
Set `corner_gif_url` in `_config.yml`.
