---
layout: default
title: Blog
---

Welcome. This page mirrors the preview aesthetics with a left navigation pane and a centered reading column.

Here’s a <span class="note-link" data-note="Hover notes follow the cursor, like in the preview.">hover note</span> for reference.

Recent posts:

{% for p in site.posts limit:2 %}
- <a href="{{ p.url | relative_url }}">{{ p.title }}</a> — {{ p.date | date: "%b %d, %Y" }}
{% endfor %}
