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
  var tip=document.getElementById('hoverNote');
  if(tip){
    function place(x,y){var pad=10, r=tip.getBoundingClientRect(); tip.style.left=Math.min(window.innerWidth-r.width-pad,x+14)+'px'; tip.style.top=Math.min(window.innerHeight-r.height-pad,y+18)+'px';}
    document.querySelectorAll('.note-link').forEach(function(el){
      el.addEventListener('mouseenter',function(e){ tip.textContent=el.getAttribute('data-note')||''; tip.style.display='block'; place(e.clientX,e.clientY); });
      el.addEventListener('mousemove',function(e){ place(e.clientX,e.clientY); });
      el.addEventListener('mouseleave',function(){ tip.style.display='none'; });
    });
  }
  var newBtn=document.getElementById('file-new');
  if(newBtn){ newBtn.addEventListener('click',function(e){ e.preventDefault(); window.location.href=(window.BASEURL||'')+'/admin/#/collections/posts/new'; }); }
  (function(){
    var BS_INTENT='https://bsky.app/intent/compose?text=';
    function excerpt(t){ if(!t) return ''; if(t.length<=100) return t; var m=t.slice(0,280).match(/(.{80,100}.*?[.!?])\s/); return (m?m[1]:t.slice(0,100));}
    function sel(){ return (''+(window.getSelection?window.getSelection():'')).trim(); }
    function postText(){ var el=document.querySelector('.post-content'); return el? el.innerText.replace(/\s+\n/g,'\n').replace(/\n{2,}/g,'\n\n').trim():document.title; }
    function firstImg(){ var img=document.querySelector('.post-content img'); return img? new URL(img.getAttribute('src'), location.href).toString():null; }
    function openIntent(text){ window.open(BS_INTENT+encodeURIComponent(text),'_blank','noopener'); }
    async function ownerPost(){
      const s=sel(), url=location.href, img=firstImg();
      const body={ text: s||postText(), url, image: img };
      const user=window.netlifyIdentity&&netlifyIdentity.currentUser();
      const token=user? await user.jwt():null;
      const res=await fetch((window.BASEURL||'')+'/.netlify/functions/bsky-post',{method:'POST',headers:{'Content-Type':'application/json', ...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
      if(!res.ok){ alert('Bluesky post failed.'); return; }
      const data=await res.json(); if(data.url){ window.open(data.url,'_blank','noopener'); }
    }
    function publicShare(){
      const s=sel(), img=firstImg(), url=location.href, base=s||excerpt(postText());
      const text=base+(img?('\n'+img):'')+'\n\n'+url; openIntent(text);
    }
    async function dynamicShare(){
      const user=window.netlifyIdentity&&netlifyIdentity.currentUser(); const owner=(window.OWNER_EMAIL||'').toLowerCase();
      if(user){ const email=(user.email||'').toLowerCase(); if(email===owner) return ownerPost(); }
      return publicShare();
    }
    var btn=document.getElementById('share-bsky'); if(btn) btn.addEventListener('click',function(e){ e.preventDefault(); dynamicShare(); });
  })();
  var gif=document.getElementById('cornerGif'); if(gif&&window.SITE_GIF_URL){ gif.style.backgroundImage='url('+window.SITE_GIF_URL+')'; }
})();