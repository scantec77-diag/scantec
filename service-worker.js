/* Scantec: guardado básico de la aplicación y biblioteca DTC para consultas offline.
   Los documentos privados de Drive no se guardan en caché. */
const SHELL="scantec-v1-shell-20261020-drive-preferred-account-v5";
const STATIC=[
 "./","./index.html","./drive.html","./drive-scantec.js","./drive-acceso.js","./biometria.js","./biblioteca.html","./manifest.webmanifest","./icons/scantec-logo.jpg","./icons/scantec-icon.svg",
 "./sensores.js","./biblioteca-marcas.js","./biblioteca-psa.js","./biblioteca/chevrolet/catalogo.json","./biblioteca/psa/catalogo.json","./biblioteca-psa.html", "./db/genericos.json","./db/marcas-a.json","./db/marcas-b.json","./db/marcas-c.json","./db/marcas-d.json"
];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(SHELL).then(async cache=>{
  await Promise.allSettled(STATIC.map(async url=>{
   try { const response=await fetch(url,{cache:"no-cache"}); if(response.ok)await cache.put(url,response); }catch{}
  }));
  await self.skipWaiting();
 }));
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(k=>k.startsWith("scantec-v1-")&&k!==SHELL).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const u=new URL(event.request.url);
 if(u.origin!==self.location.origin||!u.pathname.startsWith("/scantec/"))return;
 event.respondWith((async()=>{
  const cache=await caches.open(SHELL);
  const cached=await cache.match(event.request);
  try {
    const network=await fetch(event.request);
    if(network.ok)cache.put(event.request,network.clone()).catch(()=>{});
    return network;
  } catch(e) {
    if(cached)return cached;
    if(event.request.mode==="navigate")return (await cache.match("./index.html"))||Response.error();
    return Response.error();
  }
 })());
});
