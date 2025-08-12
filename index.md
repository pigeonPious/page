---
layout: default
title: Home
---
<header class="post-header">
  <h1 class="post-title"># Blog</h1>
  <div class="post-date">{{ "now" | date: "%b %d, %Y" }}</div>
</header>
<section class="post-content">
  <p>Welcome. This page mirrors the preview aesthetics with a left navigation pane and a centered reading column.</p>
  <p>Here’s a <span class="note-link" data-note="Hover notes follow your cursor.">hover note</span> for reference.</p>
  <p>Recent posts:</p>
  <ul>
    {% for post in site.posts limit:5 %}
      <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a> <span class="post-date">— {{ post.date | date: "%b %d, %Y" }}</span></li>
    {% endfor %}
  </ul>
</section>
