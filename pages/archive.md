---
layout: minimal
title: Archive
permalink: /archive/
---
<h2>All Posts</h2>
<p class="date">Newest to oldest</p>
<hr class="rule">
<ul style="list-style:none; padding:0; margin:0">
{% for post in site.posts %}
  <li style="padding:.4rem 0; border-bottom:1px solid var(--rule)">
    <a href="{{ post.url | relative_url }}" style="text-decoration:none; color:inherit">{{ post.title }}</a>
    <span class="date" style="margin-left:.5rem">{{ post.date | date: "%b %-d, %Y" }}</span>
  </li>
{% endfor %}
</ul>
