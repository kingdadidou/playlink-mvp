/* The chosen coordinates, never a city centroid, are sent with the event. */
(() => {
  const form=document.getElementById('createForm');
  let picker, marker;
  const lat=form.elements.lat, lng=form.elements.lng;
  const status=document.getElementById('locationStatus');
  function point(latitude,longitude){
    lat.value=Number(latitude).toFixed(6); lng.value=Number(longitude).toFixed(6);
    status.textContent='Point choisi. Tu peux déplacer le repère pour ajuster le rendez-vous.';
    if(picker){
      if(!marker){marker=L.marker([latitude,longitude],{draggable:true,icon:L.divIcon({className:'location-choice-pin',html:'<span aria-hidden="true">●</span>',iconSize:[34,34],iconAnchor:[17,17]})}).addTo(picker);marker.on('dragend',()=>{const p=marker.getLatLng();point(p.lat,p.lng);});}
      else marker.setLatLng([latitude,longitude]);
    }
  }
  function read(){
    const latitude=Number(lat.value),longitude=Number(lng.value);
    if(!lat.value.trim()||!lng.value.trim()||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){status.textContent='Place le point de rendez-vous sur la carte avant de publier.';status.scrollIntoView?.({block:'center',behavior:'smooth'});throw new Error('Place le point de rendez-vous sur la carte.');}
    return [latitude,longitude];
  }
  function open(){requestAnimationFrame(()=>{
    if(typeof L==='undefined'){status.textContent='Carte indisponible. Tu peux saisir les coordonnées du rendez-vous ci-dessous.';return;}
    if(!picker){
      picker=L.map('locationPicker',{scrollWheelZoom:false}).setView([48.857,2.352],12);
      const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(picker);
      tiles.on('tileerror',()=>{status.textContent='Le fond de carte est indisponible. Vérifie ta connexion ou saisis les coordonnées.';});
      picker.on('click',e=>point(e.latlng.lat,e.latlng.lng));
    }
    picker.invalidateSize();
    if(lat.value&&lng.value){try{const p=read();point(...p);picker.setView(p,16);}catch{}}
    else if(cityCoordinates[form.elements.city.value])picker.setView(cityCoordinates[form.elements.city.value],13);
  });}
  form.elements.city.addEventListener('change',()=>{const p=cityCoordinates[form.elements.city.value];if(p&&picker)picker.setView(p,13);});
  [lat,lng].forEach(input=>input.addEventListener('change',()=>{try{const p=read();point(...p);if(picker)picker.setView(p,16);}catch{status.textContent='Renseigne une latitude et une longitude valides.';}}));
  form.addEventListener('reset',()=>{if(marker){marker.remove();marker=null;}status.textContent='Touche la carte pour placer le point de rendez-vous.';});
  function clear(){lat.value='';lng.value='';if(marker){marker.remove();marker=null;}status.textContent='Choisis une adresse ou place le point sur la carte.';}
  function choose(latitude,longitude){point(latitude,longitude);if(picker)picker.setView([latitude,longitude],16);}
  window.PlayLinkLocation={open,read,choose,clear};
})();
