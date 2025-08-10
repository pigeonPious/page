
# Project-site setup (important)

This repo is intended for a GitHub **project site** at `https://pigeonpious.github.io/page/`.

- `_config.yml` sets `url` and `baseurl: /page` so assets resolve correctly.
- Do **not** include a `.nojekyll` file. If present, delete it so Jekyll builds.
- New images: put in `assets/images/` and reference with `{{ '/assets/images/your.png' | relative_url }}`.
