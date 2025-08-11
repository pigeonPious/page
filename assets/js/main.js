(function(){
  document.querySelectorAll('[data-menu]').forEach(function(label){
    label.addEventListener('click',function(e){
      e.preventDefault();
      var item=label.parentElement;
      var open=item.classList.contains('open');
      document.querySelectorAll('.menu-item').forEach(function(i){i.classList.remove('open');});
      if(!open)item.classList.add('open');
    });
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('.menu-item'))document.querySelectorAll('.menu-item').forEach(function(i){i.classList.remove('open');});
  });
  document.querySelectorAll('[data-mode]').forEach(function(btn){
    btn.addEventListener('click',function(){
      if(btn.dataset.mode==='light'){document.documentElement.classList.add('light');}
      else{document.documentElement.classList.remove('light');}
    });
  });
  var tip = document.getElementById('hoverNote');
  if (tip){
    function place(x,y){
      var pad = 10;
      var rect = tip.getBoundingClientRect();
      var nx = Math.min(window.innerWidth - rect.width - pad, x + 14);
      var ny = Math.min(window.innerHeight - rect.height - pad, y + 18);
      tip.style.left = nx + 'px';
      tip.style.top  = ny + 'px';
    }
    document.querySelectorAll('.note-link').forEach(function(el){
      el.addEventListener('mouseenter', function(e){
        tip.textContent = el.getAttribute('data-note') || '';
        tip.style.display = 'block';
        place(e.clientX, e.clientY);
      });
      el.addEventListener('mousemove', function(e){ place(e.clientX, e.clientY); });
      el.addEventListener('mouseleave', function(){ tip.style.display='none'; });
    });
  }
  var gif = document.getElementById('cornerGif');
  if(gif && window.SITE_GIF_URL){ gif.style.backgroundImage = 'url(' + window.SITE_GIF_URL + ')'; }
})();