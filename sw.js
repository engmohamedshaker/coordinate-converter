/* by eng. Mohamed Shaker - offline cache for the converter app */
var CACHE = 'mshaker-converter-v10';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
var LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.2/proj4.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(SHELL).then(function(){
      return Promise.all(LIBS.map(function(u){
        return fetch(new Request(u, {mode:'no-cors'})).then(function(r){ return c.put(u, r); }).catch(function(){});
      }));
    });
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.indexOf('arcgisonline.com') > -1 || req.url.indexOf('overpass') > -1) return;   /* map tiles: never cache */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function(res){
      var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put('index.html', copy); }); return res;
    }).catch(function(){ return caches.match('index.html').then(function(r){ return r || caches.match('./'); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    if (hit) return hit;
    return fetch(req).then(function(res){
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
      return res;
    });
  }));
});
