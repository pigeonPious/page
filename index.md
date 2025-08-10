
---
layout: default
title: Blog
---
<div class="post-header">
  <div class="post-date">{{ site.time | date: "%b %-d, %Y" }}</div>
  <h1 class="post-title"># Blog</h1>
</div>

<ul class="post-list">
{% for post in site.posts %}
  <li>
    <a href="{{ post.url | relative_url }}"><strong>{{ post.title }}</strong></a>
    <div class="meta">{{ post.date | date: "%b %-d, %Y" }}</div>
    <p>{{ post.excerpt | strip_html | truncate: 140 }}</p>
    <hr class="soft">
  </li>
{% endfor %}
</ul>
