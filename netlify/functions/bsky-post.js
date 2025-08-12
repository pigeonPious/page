const fetch=(...a)=>import('node-fetch').then(({default:f})=>f(...a));
const OWNER_EMAIL=process.env.OWNER_EMAIL, BSKY_HANDLE=process.env.BSKY_HANDLE, BSKY_APP_PASSWORD=process.env.BSKY_APP_PASSWORD;
exports.handler=async function(event,context){
  if(event.httpMethod!=='POST')return{statusCode:405,body:''};
  const user=context&&context.clientContext&&context.clientContext.user;
  const email=user&&user.email;
  if(!email||email.toLowerCase()!==(OWNER_EMAIL||'').toLowerCase()) return {statusCode:403,body:'forbidden'};
  let p={}; try{p=JSON.parse(event.body||'{}')}catch(e){}
  const text=(''+(p.text||'')).toString(), url=(''+(p.url||'')).toString(), image=p.image?(''+p.image):null;
  if(!text||!url) return {statusCode:400,body:'missing text/url'};
  const sessRes=await fetch('https://bsky.social/xrpc/com.atproto.server.createSession',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:BSKY_HANDLE,password:BSKY_APP_PASSWORD})});
  if(!sessRes.ok) return {statusCode:502,body:'bsky auth failed'};
  const sess=await sessRes.json(); if(!sess||!sess.accessJwt) return {statusCode:502,body:'bsky auth failed'};
  const auth={Authorization:`Bearer ${sess.accessJwt}`,'Content-Type':'application/json'};
  const postText=(text+'\n\n'+url+(image?('\n'+image):'')).slice(0,3000);
  const postRes=await fetch('https://bsky.social/xrpc/app.bsky.feed.post',{method:'POST',headers:auth,body:JSON.stringify({$type:'app.bsky.feed.post',text:postText,createdAt:new Date().toISOString(),facets:[]})});
  if(!postRes.ok){ const t=await postRes.text(); return {statusCode:502,body:'post failed: '+t}; }
  const out=await postRes.json(); const uri=out&&out.uri; const rkey=uri?uri.split('/').pop():null;
  const postUrl=(rkey&&BSKY_HANDLE)?`https://bsky.app/profile/${BSKY_HANDLE}/post/${rkey}`:null;
  return {statusCode:200,body:JSON.stringify({ok:true,url:postUrl})};
};