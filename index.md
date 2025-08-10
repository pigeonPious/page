---
layout: minimal
title: Home
---
{% assign post = site.posts.first %}
{% if post %}
<h2>{{ post.title }}</h2>
<p class="date">{{ post.date | date: "%B %-d, %Y · %-I:%M %p" }}</p>
{{ post.content }}
<hr class="rule">
<p><a href="{{ '/archive/' | relative_url }}">Browse the archive →</a></p>
{% else %}
<p>No posts yet.</p>
{% endif %}
