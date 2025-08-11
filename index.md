---
layout: default
title: Blog
---
<header class="post-header">
  <h1 class="post-title"># Blog</h1>
  <div class="post-date">{{ site.time | date: "%b %-d, %Y" }}</div>
</header>

<section class="post-content">
{% for post in site.posts %}
- <a href="{{ post.url | relative_url }}">{{ post.title }}</a> <span class="post-date" style="margin-left:6px;">{{ post.date | date: "%b %-d, %Y" }}</span><br/>
{% endfor %}
</section>
