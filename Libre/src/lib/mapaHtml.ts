/**
 * Página Leaflet + OpenStreetMap que se carga en un WebView (sin claves de API).
 * RN → web: window.setTiendas([[id, lat, lon, color, nombre], ...]), setUsuario(lat, lon), irA(lat, lon, zoom), resaltar(id)
 * web → RN: {type:'bounds', sur, oeste, norte, este, zoom} | {type:'select', id}
 */
export const MAPA_HTML = `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<style>
  html,body,#m{height:100%;margin:0;background:#F3EEFA}
  .leaflet-container{background:#F3EEFA;-webkit-tap-highlight-color:transparent}
  .tienda{display:flex;flex-direction:column;align-items:center;width:110px;margin-left:-55px;margin-top:-44px;
    font-family:-apple-system,Roboto,sans-serif}
  .pin{width:40px;height:40px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}
  .pin span{transform:rotate(45deg);font-size:20px;line-height:1}
  .et{margin-top:3px;max-width:110px;padding:1px 5px;border-radius:6px;background:rgba(255,255,255,.92);
    color:#1B241E;font-size:11px;font-weight:700;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    box-shadow:0 1px 3px rgba(0,0,0,.4)}
  .zoom-bajo .et{display:none}
  .zoom-bajo .pin{width:32px;height:32px}
  .zoom-bajo .pin span{font-size:16px}
  .tienda.sel{z-index:9999 !important}
  .tienda.sel .pin{transform:rotate(-45deg) scale(1.3);border-color:#FFD54F}
  .tienda.sel .et{background:#FFD54F}
  #modo{position:absolute;right:10px;bottom:28px;z-index:1000;border:0;border-radius:999px;padding:9px 14px;
    background:rgba(255,255,255,.95);color:#22252E;font:700 12px -apple-system,Roboto,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35)}
  .leaflet-control-attribution{font-size:9px}
  .yo{width:22px;height:22px;border-radius:50%;background:#2979FF;border:4px solid #fff;box-shadow:0 0 0 6px rgba(41,121,255,.3)}
</style>
</head><body><div id="m"></div><button id="modo"></button>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
  var map = L.map('m', {zoomControl:false}).setView([40.2, -3.7], 6);
  var satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
  });
  var etiquetas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
  });
  var calles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
  var modoSatelite = true;
  satelite.addTo(map); etiquetas.addTo(map);
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Imágenes © Esri, Maxar, Earthstar Geographics · Mapa © OpenStreetMap');

  window.cambiarMapa = function(){
    modoSatelite = !modoSatelite;
    if (modoSatelite) { map.removeLayer(calles); satelite.addTo(map); etiquetas.addTo(map); }
    else { map.removeLayer(satelite); map.removeLayer(etiquetas); calles.addTo(map); }
    boton.textContent = modoSatelite ? '🗺️ Mapa' : '🛰️ Satélite';
  };
  var boton = document.getElementById('modo');
  boton.textContent = '🗺️ Mapa';
  boton.addEventListener('click', function(e){ e.stopPropagation(); window.cambiarMapa(); });
  var capa = L.layerGroup().addTo(map);
  var marcadores = {};
  var usuario = null;
  var sel = null;

  function enviar(o){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function ajustarZoom(){
    document.getElementById('m').classList.toggle('zoom-bajo', map.getZoom() < 14);
  }
  function emitirBounds(){
    var b = map.getBounds();
    enviar({type:'bounds', sur:b.getSouth(), oeste:b.getWest(), norte:b.getNorth(), este:b.getEast(), zoom:map.getZoom()});
  }
  var t;
  map.on('zoomend', ajustarZoom);
  map.on('moveend', function(){ clearTimeout(t); t = setTimeout(emitirBounds, 400); });
  ajustarZoom();

  function marcarSel(id, on){
    var m = marcadores[id]; if (!m) return;
    var el = m.getElement(); if (el) el.classList.toggle('sel', on);
    m.setZIndexOffset(on ? 10000 : 0);
  }

  window.setTiendas = function(lista){
    capa.clearLayers(); marcadores = {};
    lista.forEach(function(x){
      var icono = L.divIcon({
        className: '',
        iconSize: [0, 0],
        html: '<div class="tienda"><div class="pin" style="background:' + x[3] + '"><span>🛒</span></div>' +
              '<div class="et">' + esc(x[4]) + '</div></div>'
      });
      var m = L.marker([x[1], x[2]], {icon: icono});
      m.on('click', function(){ enviar({type:'select', id:x[0]}); });
      m.addTo(capa);
      marcadores[x[0]] = m;
    });
    if (sel) marcarSel(sel, true);
  };
  window.resaltar = function(id){
    if (sel) marcarSel(sel, false);
    sel = id;
    if (id) marcarSel(id, true);
  };
  window.setUsuario = function(lat, lon){
    if (usuario) map.removeLayer(usuario);
    usuario = L.marker([lat, lon], {icon: L.divIcon({className:'', html:'<div class="yo"></div>', iconSize:[22,22], iconAnchor:[11,11]}), interactive:false, zIndexOffset:-1000}).addTo(map);
  };
  window.irA = function(lat, lon, zoom){ map.setView([lat, lon], zoom || 14); };
  enviar({type:'listo'});
  emitirBounds();
</script></body></html>`;
