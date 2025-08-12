// Menu open/close
document.querySelectorAll('[data-menu]').forEach(function(label){
  label.addEventListener('click', function(e){
    var item = label.parentElement;
    var open = item.classList.contains('open');
    document.querySelectorAll('.menu-item').forEach(function(i){ i.classList.remove('open'); });
    if(!open) item.classList.add('open');
  });
});
document.addEventListener('click', function(e){
  if(!e.target.closest('.menu-item')) document.querySelectorAll('.menu-item').forEach(function(i){ i.classList.remove('open'); });
});

// Theme toggle
(function(){
  var root = document.documentElement;
  var stored = localStorage.getItem('mode');
  if(stored) root.setAttribute('data-mode', stored);
  document.querySelectorAll('[data-mode]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var mode = btn.getAttribute('data-mode');
      root.classList.add('transitioning');
      root.setAttribute('data-mode', mode);
      localStorage.setItem('mode', mode);
      setTimeout(function(){ root.classList.remove('transitioning'); }, 160);
    });
  });
})();

// Simple "Edit > Find" filter for left post list
(function(){
  var search = document.querySelector('[data-action="find"]');
  if(!search) return;
  search.addEventListener('click', function(){
    var q = prompt('Filter posts (case-insensitive):','');
    if(q===null) return;
    q = q.trim().toLowerCase();
    document.querySelectorAll('.tree a').forEach(function(a){
      var show = !q || a.textContent.toLowerCase().indexOf(q) !== -1;
      a.parentElement.style.display = show ? '' : 'none';
    });
  });
})();

// Edit > Back/Forward
document.querySelectorAll('[data-action="back"]').forEach(function(e){ e.addEventListener('click', function(){ history.back(); }); });
document.querySelectorAll('[data-action="forward"]').forEach(function(e){ e.addEventListener('click', function(){ history.forward(); }); });

// Hover notes that follow cursor
(function(){
  var tip = document.getElementById('hoverNote');
  if(!tip) return;
  function place(x,y){
    tip.style.display = 'block';
    tip.style.left = Math.min(window.innerWidth - tip.offsetWidth - 12, x + 16) + 'px';
    tip.style.top  = Math.min(window.innerHeight - tip.offsetHeight - 12, y + 18) + 'px';
  }
  document.querySelectorAll('.note-link').forEach(function(el){
    el.addEventListener('mouseenter', function(e){
      tip.textContent = el.getAttribute('data-note') || '';
      place(e.clientX, e.clientY);
    });
    el.addEventListener('mousemove', function(e){ place(e.clientX, e.clientY); });
    el.addEventListener('mouseleave', function(){ tip.style.display='none'; });
  });
})();
