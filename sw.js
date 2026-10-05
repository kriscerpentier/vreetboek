const CACHE="mijn-kookboek-v4";
const APP_ASSETS=["./","index.html","styles.css","app.js","manifest.json","config.js","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method==="POST" && new URL(req.url).pathname.endsWith("/share-target")){
    e.respondWith((async()=>{
      const form=await req.formData();
      const qs=new URLSearchParams();
      for(const k of ["title","text","url"]){const v=form.get(k);if(typeof v==="string"&&v)qs.set(k,v)}
      return Response.redirect(new URL("./?shared=1&"+qs.toString(),req.url).href,303);
    })());
    return;
  }
  if(req.method!=="GET") return;
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res}).catch(()=>caches.match("./"))));
});
