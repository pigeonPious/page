---
layout: default
title: Posts
permalink: /posts/
---
<header class="post-header">
  <h1 class="post-title">All Posts</h1>
</header>
<section class="post-content">
  <ul>
  {% for post in site.posts %}
    <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a> <span class="post-date">— {{ post.date | date: "%b %d, %Y" }}</span></li>
  {% endfor %}
  </ul>
</section>
