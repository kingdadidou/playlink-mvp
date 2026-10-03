(() => {
  const map=L.map('map').setView([48.857,2.352],12), layer=L.layerGroup().addTo(map);
  let mode='explore',selected;
  const message=document.getElementById('message');
  const send=data=>window.ReactNativeWebView?.postMessage(JSON.stringify(data));
  const icon=L.divIcon({className:'pin',iconSize:[18,18],iconAnchor:[9,9]});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map).on('tileload',()=>{message.textContent=mode==='pick'?'Touche la carte pour choisir le rendez-vous.':'Touche un repère pour ouvrir la session.';}).on('tileerror',()=>{message.textContent='Fond de carte indisponible. Vérifie ta connexion.';});
  function choose(lat,lng,notify){
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return;
    if(selected)selected.remove();
    selected=L.marker([lat,lng],{icon,draggable:mode==='pick'}).addTo(map);
    selected.on('dragend',()=>{const p=selected.getLatLng();send({type:'point',lat:p.lat,lng:p.lng});});
    if(notify)send({type:'point',lat,lng});
  }
  map.on('click',e=>{if(mode==='pick')choose(e.latlng.lat,e.latlng.lng,true);});
  window.renderPlayLinkMap=data=>{
    mode=data.mode==='pick'?'pick':'explore';layer.clearLayers();if(selected){selected.remove();selected=null;}
    if(mode==='pick'){
      message.textContent='Touche la carte pour choisir le rendez-vous.';
      if(data.point){choose(data.point.lat,data.point.lng,false);map.setView([data.point.lat,data.point.lng],16);}
    }else{
      const points=[];
      for(const e of data.events||[]){if(!Number.isFinite(e.lat)||!Number.isFinite(e.lng))continue;const m=L.marker([e.lat,e.lng],{icon}).addTo(layer);m.on('click',()=>send({type:'event',id:e.id}));points.push([e.lat,e.lng]);}
      if(points.length)map.fitBounds(points,{padding:[30,30],maxZoom:15});
      message.textContent=points.length?'Touche un repère pour ouvrir la session.':'Aucune session à afficher.';
    }
    map.invalidateSize();
  };
  send({type:'ready'});
})();
