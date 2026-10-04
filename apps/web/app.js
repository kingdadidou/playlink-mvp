const initialEvents = [
  {id:1,sport:"Running",title:"Running 10 km du dimanche",date:"2026-10-04",time:"10:00",location:"Parc de Sceaux",city:"Sceaux",lat:48.7745,lng:2.2988,level:"Intermédiaire",maxParticipants:12,participants:7,joinMode:"instant",organizer:"Thomas",description:"Sortie running conviviale, allure autour de 5:30/km."},
  {id:2,sport:"Football",title:"Five 5v5 après le travail",date:"2026-10-05",time:"19:30",location:"UrbanSoccer",city:"Palaiseau",lat:48.7148,lng:2.2452,level:"Tous niveaux",maxParticipants:10,participants:8,joinMode:"approval",organizer:"Lucas",description:"Match amical. Validation par l'organisateur avant participation."},
  {id:3,sport:"Tennis",title:"Tennis simple - niveau loisir",date:"2026-10-06",time:"18:00",location:"Courts municipaux",city:"Massy",lat:48.7309,lng:2.2713,level:"Loisir",maxParticipants:2,participants:1,joinMode:"instant",organizer:"Emma",description:"Recherche un partenaire pour une heure de tennis."}
];

const cityCoordinates = {
  Sceaux:[48.776,2.295], Palaiseau:[48.714,2.246], Massy:[48.730,2.272],
  Antony:[48.753,2.297], Paris:[48.857,2.352], Versailles:[48.804,2.134],
  Lyon:[45.758,4.833], Marseille:[43.297,5.370], Lille:[50.630,3.058],
  Bordeaux:[44.838,-0.579], Toulouse:[43.604,1.444], Nantes:[47.218,-1.553],
  Rennes:[48.117,-1.678], Strasbourg:[48.573,7.752]
};
function readSaved(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
let events = readSaved("playlink-events", initialEvents);
if (!Array.isArray(events)) events = initialEvents;
let correctedSavedPositions = false;
events.forEach(event => {
  if (Number(event.id) > 3 && cityCoordinates[event.city]) {
    [event.lat, event.lng] = cityCoordinates[event.city];
    correctedSavedPositions = true;
  }
});
if (correctedSavedPositions) localStorage.setItem("playlink-events", JSON.stringify(events));
const joinedIds = new Set(readSaved("playlink-joined", []));
const pendingIds = new Set(readSaved("playlink-pending", []));
let map = null;
let mapReady = false;
let markers = [];
let markerById = new Map();
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[char]);
let toastTimer;
function showToast(message){
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 4500);
}
function initMap(){
  if (typeof L === "undefined") {
    return;
  }
  try {
    map = L.map("map", {scrollWheelZoom:false}).setView([48.74, 2.27], 11);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom:19, attribution:"&copy; OpenStreetMap"
    }).addTo(map);
    tiles.on("tileload", () => {
      if (!mapReady) {
        mapReady = true;
        $("mapWrap").classList.add("map-ready");
        map.invalidateSize();
      }
    });
  } catch (error) {
    map = null;
    console.warn("Carte Leaflet indisponible ; utilisation de la carte simplifiée.", error);
  }
}
initMap();

function renderFallback(list){
  const valid = list.filter(e => Number.isFinite(Number(e.lat)) && Number.isFinite(Number(e.lng)));
  $("fallbackPopup").classList.add("hidden");
  if (!valid.length) {
    $("fallbackPins").innerHTML = '<p class="fallback-empty">Aucun événement à afficher sur la carte.</p>';
    return;
  }
  const lats = valid.map(e => Number(e.lat));
  const lngs = valid.map(e => Number(e.lng));
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.045);
  const lngSpan = Math.max(maxLng - minLng, 0.07);
  const centerLat = (minLat + maxLat) / 2, centerLng = (minLng + maxLng) / 2;
  $("fallbackPins").innerHTML = valid.map((event, index) => {
    const x = Math.max(9, Math.min(88, 50 + (Number(event.lng) - centerLng) / lngSpan * 72));
    const y = Math.max(20, Math.min(78, 50 - (Number(event.lat) - centerLat) / latSpan * 55));
    const offset = index % 3 * 2;
    return `<button type="button" class="fallback-pin" style="left:${x + offset}%;top:${y}%" data-fallback-id="${escapeHtml(event.id)}" aria-label="Voir ${escapeHtml(event.title)} à ${escapeHtml(event.city)}"><span class="fallback-dot" style="background:${globalThis.PlayLinkSportIcon?.color(event.sport)||'#e95b32'}">${globalThis.PlayLinkSportIcon?.svg(event.sport)||'●'}</span><span class="fallback-city">${escapeHtml(event.city)}</span></button>`;
  }).join("");
}

function showFallbackEvent(id){
  const event = events.find(item => String(item.id) === String(id));
  if (!event) return;
  const popup = $("fallbackPopup");
  popup.innerHTML = `<strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.date)} · ${escapeHtml(event.time)} · ${escapeHtml(event.location)}</span>`;
  popup.classList.remove("hidden");
  $("mapWrap").scrollIntoView({behavior:"smooth",block:"center"});
}

function modeLabel(mode){
  return mode === "instant" ? "Inscription immédiate" : "Validation organisateur";
}

function eventCard(event){
  const percent = Math.min(100, Math.round((event.participants / event.maxParticipants) * 100));
  const joined = joinedIds.has(event.id);
  const pending = pendingIds.has(event.id);
  const full = event.participants >= event.maxParticipants;
  const action = joined ? "Inscrit" : pending ? "Demande envoyée" : full ? "Complet" : event.joinMode === "instant" ? "Rejoindre" : "Demander une place";
  return `
  <article class="card" data-sport="${escapeHtml(event.sport)}" data-event-id="${Number(event.id)}">
    <div class="card-top">
      <span class="sport"><span class="sport-symbol" style="color:${globalThis.PlayLinkSportIcon?.color(event.sport)||'#173e32'}">${globalThis.PlayLinkSportIcon?.svg(event.sport)||''}</span>${escapeHtml(event.sport)}</span>
      <span class="mode">${modeLabel(event.joinMode)}</span>
    </div>
    <h3>${escapeHtml(event.title)}</h3>
    <div class="meta">
      <span class="event-date">${escapeHtml(new Date(event.date + 'T12:00:00').toLocaleDateString('fr-FR', {weekday:'short',day:'numeric',month:'short'}))} · ${escapeHtml(event.time)}</span>
      <span>${escapeHtml(event.city)}</span>
      <span>${escapeHtml(event.level)}</span>
      <span>Avec ${escapeHtml(event.organizer)}</span>
    </div>
    <div class="progress"><span style="width:${percent}%"></span></div>
    <div class="card-footer">
      <small><strong>${Math.max(0, event.maxParticipants - event.participants)} place${event.maxParticipants - event.participants > 1 ? 's' : ''}</strong> disponible${event.maxParticipants - event.participants > 1 ? 's' : ''}</small>
      <div class="card-actions"><button class="locate" type="button" data-locate="${Number(event.id)}">Voir sur la carte</button><button class="join" type="button" data-join="${Number(event.id)}" ${joined || pending || full ? "disabled" : ""}>${action}</button></div>
    </div>
  </article>`;
}

function filteredEvents(){
  const query = $("search").value.trim().toLowerCase();
  const sport = $("sportFilter").value;
  const mode = $("modeFilter").value;
  return events.filter(e => {
    const matchesQuery = !query || [e.title,e.sport,e.city,e.location].join(" ").toLowerCase().includes(query);
    const matchesSport = !sport || e.sport === sport;
    const matchesMode = !mode || e.joinMode === mode;
    return matchesQuery && matchesSport && matchesMode;
  });
}

function render(){
  const list = filteredEvents();
  $("eventCount").textContent = events.length;
  $("resultCount").textContent = `${list.length} résultat${list.length > 1 ? "s" : ""}`;
  const content = list.length ? list.map(eventCard).join("") : '<div class="empty-state"><strong>Aucun événement trouvé</strong><p>Essaie un autre sport ou une autre ville.</p><button type="button" class="ghost" id="clearFilters">Effacer les filtres</button></div>';
  $("eventList").innerHTML = content;
  $("eventGrid").innerHTML = content;
  renderFallback(list);
  if (!map) return;
  markers.forEach(marker => map.removeLayer(marker));
  markerById.clear();
  markers = list.filter(e => Number.isFinite(Number(e.lat)) && Number.isFinite(Number(e.lng))).map(e => {
    const marker = L.marker([Number(e.lat), Number(e.lng)], {
      icon:L.divIcon({className:"event-pin", html:`<span class="sport-map-pin" style="--sport-color:${globalThis.PlayLinkSportIcon?.color(e.sport)||'#e95b32'}">${globalThis.PlayLinkSportIcon?.svg(e.sport)||'●'}</span>`, iconSize:[44,50], iconAnchor:[22,48], popupAnchor:[0,-42]})
    }).addTo(map);
    marker.bindPopup(`<strong>${escapeHtml(e.title)}</strong><br>${escapeHtml(e.date)} · ${escapeHtml(e.time)}<br>${escapeHtml(e.location)}<br><em>${modeLabel(e.joinMode)}</em>${window.PlayLink?.ready ? `<br><button class="primary" data-action="detail" data-id="${escapeHtml(e.id)}">Ouvrir la session</button>` : ''}`);
    markerById.set(e.id, marker);
    return marker;
  });
  if (markers.length) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.35), {maxZoom:12});
}

function joinEvent(id){
  const event = events.find(e => e.id === id);
  if(!event) return;
  if(joinedIds.has(id) || pendingIds.has(id)) return;
  if(event.participants >= event.maxParticipants){
    showToast("Cet événement est complet.");
    return;
  }
  if(event.joinMode === "instant"){
    event.participants += 1;
    joinedIds.add(id);
    localStorage.setItem("playlink-joined", JSON.stringify([...joinedIds]));
    localStorage.setItem("playlink-events", JSON.stringify(events));
    render();
    showToast("Inscription confirmée !");
  } else {
    pendingIds.add(id);
    localStorage.setItem("playlink-pending", JSON.stringify([...pendingIds]));
    render();
    showToast("Demande enregistrée dans cette démo.");
  }
}

document.addEventListener("click", e => {
  const join = e.target.closest("[data-join]");
  if (join) { joinEvent(Number(join.dataset.join)); return; }
  const locate = e.target.closest("[data-locate]");
  if (locate) {
    if ($("mapView").classList.contains("hidden")) setView("map");
    const id = Number(locate.dataset.locate);
    const marker = markerById.get(id);
    if (mapReady && marker) { map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13)); marker.openPopup(); $("mapWrap").scrollIntoView({behavior:"smooth",block:"center"}); }
    else showFallbackEvent(id);
    return;
  }
  const fallbackPin = e.target.closest("[data-fallback-id]");
  if (fallbackPin) { if(window.PlayLink?.ready)window.PlayLink.openDetail(fallbackPin.dataset.fallbackId);else showFallbackEvent(Number(fallbackPin.dataset.fallbackId)); return; }
  if (e.target.id === "clearFilters") {
    $("search").value = ""; $("sportFilter").value = ""; $("modeFilter").value = ""; if ($("urgentOnly")) $("urgentOnly").checked = false; render();
  }
  const close = e.target.closest("[data-close]");
  if (close) $(close.dataset.close).close();
});

["search","sportFilter","modeFilter"].forEach(id => $(id).addEventListener("input", render));

function setView(view){
  const list = view === "list";
  $("mapView").classList.toggle("hidden", list);
  $("listView").classList.toggle("hidden", !list);
  $("toggleView").textContent = list ? "Vue carte" : "Vue liste";
  $("toggleView").setAttribute("aria-pressed", String(list));
  if (!list && map) requestAnimationFrame(() => map.invalidateSize());
}
$("toggleView").addEventListener("click", () => setView($("mapView").classList.contains("hidden") ? "map" : "list"));

$("openCreate").addEventListener("click", () => $("createDialog").showModal());
$("notifyBtn").addEventListener("click", () => $("notifyDialog").showModal());
$("createForm").elements.date.min = new Date().toLocaleDateString("en-CA");

$("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  if(window.PlayLink){try{await window.PlayLink.createEvent(data);}catch(error){showToast(error.message);}return;}
  const city = data.get("city");
  const [lat,lng] = cityCoordinates[city];
  const newEvent = {
    id: Date.now(),
    sport: data.get("sport"),
    title: data.get("title"),
    date: data.get("date"),
    time: data.get("time"),
    location: data.get("location"),
    city, lat, lng,
    level: data.get("level"),
    maxParticipants: Number(data.get("maxParticipants") || 10),
    participants: 1,
    joinMode: data.get("joinMode"),
    organizer: "Moi",
    description: data.get("description") || ""
  };
  events.unshift(newEvent);
  localStorage.setItem("playlink-events", JSON.stringify(events));
  e.target.reset();
  $("createDialog").close();
  render();
  setView("map");
  const marker = markerById.get(newEvent.id);
  if (mapReady && marker) { map.setView(marker.getLatLng(), 13); marker.openPopup(); }
  else showFallbackEvent(newEvent.id);
  showToast("Événement créé dans cette démo.");
});

const pref = readSaved("playlink-notifications", {});
$("notifyCity").value = pref.city || "";
$("notifyRadius").value = pref.radius || "10 km";
$("notifySports").value = pref.sports || "";
$("pushEnabled").checked = false;
$("emailEnabled").checked = false;

$("notifyDialog").querySelector("form").addEventListener("submit", e => {
  e.preventDefault();
  localStorage.setItem("playlink-notifications", JSON.stringify({
    city: $("notifyCity").value,
    radius: $("notifyRadius").value,
    sports: $("notifySports").value,
    push: $("pushEnabled").checked,
    email: $("emailEnabled").checked
  }));
  $("notifyDialog").close();
  showToast("Préférences enregistrées. Consulte l’onglet Notifications.");
});

render();
