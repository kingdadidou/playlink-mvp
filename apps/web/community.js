/* Shared-account features. Supabase enforces permissions and capacity on the server. */
(() => {
  const cfg = window.PLAYLINK_CONFIG;
  const ready = Boolean(cfg?.url && cfg?.key);
  const esc = escapeHtml;
  let session = readSaved('playlink-session', null);
  let snapshot = {profiles:[],events:[],participations:[],friendships:[],groups:[],members:[],invitations:[],messages:[],reports:[],blocks:[],notifications:[]};
  let view = 'discover', activityTab = 'upcoming', detailId = null, busy = false;
  let refreshPromise = null;
  const uid = () => session?.user?.id;
  const person = id => snapshot.profiles.find(p => p.id === id);
  const name = id => person(id)?.name || 'Sportif';
  const mine = id => snapshot.participations.find(p => p.event_id === id && p.user_id === uid());
  const friends = () => snapshot.friendships.filter(f => f.status === 'accepted').map(f => f.sender === uid() ? f.receiver : f.sender);
  const future = e => !e.cancelled && new Date(e.starts_at) > new Date();
  const date = s => new Date(s).toLocaleString('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const button = (label, action, attrs='', kind='ghost') => `<button type="button" class="${kind}" data-action="${action}" ${attrs}>${esc(label)}</button>`;
  const empty = text => `<p class="empty-state">${esc(text)}</p>`;
  const labelStatus = s => ({accepted:'Inscrit',pending:'En attente de validation',waitlisted:'Liste d’attente',cancelled:'Désistement',rejected:'Participation refusée'})[s] || '';

  async function request(path, options={}, auth=true) {
    if (!ready) throw new Error('La connexion aux comptes est en cours de configuration.');
    if (auth && session && Date.now() > (session.expires_at || 0)*1000-60000) await refresh();
    const response = await fetch(cfg.url + path, {...options, headers:{apikey:cfg.key, ...(auth && session ? {Authorization:`Bearer ${session.access_token}`} : {}), 'Content-Type':'application/json', ...options.headers}});
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || body.msg || body.error_description || 'Action impossible. Réessaie dans un instant.');
    return body;
  }
  function saveSession(value) { if(value && !value.expires_at)value.expires_at=Math.floor(Date.now()/1000)+(value.expires_in||3600); session=value; if(value) localStorage.setItem('playlink-session',JSON.stringify(value)); else localStorage.removeItem('playlink-session'); }
  async function refresh() {
    if (!refreshPromise) refreshPromise=(async()=>{
      try { saveSession(await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})},false)); }
      catch(error) { saveSession(null); throw new Error('Ta session a expiré. Connecte-toi à nouveau.'); }
    })().finally(()=>{refreshPromise=null;});
    return refreshPromise;
  }
  async function act(action,data={}) {
    if (!uid()) { openAuth(); return; }
    if (busy) return;
    busy=true;
    document.body.classList.add('saving');
    try { const result=await request('/rest/v1/rpc/playlink_action',{method:'POST',body:JSON.stringify({action,data})}); await load(); return result; }
    finally { busy=false; document.body.classList.remove('saving'); }
  }
  function syncEvents() {
    events=snapshot.events.filter(e=>!e.cancelled && future(e)).map(e=>{
      const d=new Date(e.starts_at);
      return {...e, date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,time:d.toTimeString().slice(0,5),maxParticipants:e.capacity,participants:snapshot.participations.filter(p=>p.event_id===e.id && p.status==='accepted').length,joinMode:e.join_mode,organizer:name(e.organizer_id)};
    });
    joinedIds.clear(); pendingIds.clear();
    snapshot.participations.filter(p=>p.user_id===uid()).forEach(p=>{if(p.status==='accepted')joinedIds.add(p.event_id);if(p.status==='pending')pendingIds.add(p.event_id);});
    render();
  }
  async function load() {
    if (!ready) return;
    if (uid()) snapshot=await request('/rest/v1/rpc/snapshot',{method:'POST',body:'{}'});
    else {
      snapshot={...snapshot,profiles:[],friendships:[],groups:[],members:[],invitations:[],messages:[],reports:[],blocks:[],notifications:[],moderator:false};
      const [es,ps]=await Promise.all([request('/rest/v1/events?select=*&cancelled=eq.false&order=starts_at',{},false),request('/rest/v1/participations?select=event_id,status',{},false)]);
      snapshot.events=es;snapshot.participations=ps;
    }
    syncEvents(); renderPanel(); renderAccount();
    if(detailId && $('eventDialog').open) renderDetail(detailId);
  }
  function renderAccount(){
    $('accountButton').textContent=uid()?name(uid()):'Se connecter';
    $('connectionNotice').textContent=ready ? (uid()?'':'Crée ton profil pour rejoindre une session et retrouver tes amis.') : 'Les fonctions sociales seront disponibles après la connexion de la base PlayLink.';
    $('communityNav').querySelector('[data-view="moderation"]').hidden=!snapshot.moderator;
    const unread=snapshot.notifications.filter(n=>!n.seen).length;
    $('notificationsButton').textContent=unread?`Notifications (${unread})`:'Notifications';
  }
  function openAuth(){ $('authDialog').showModal(); }
  function confirmAction(action){
    const descriptions={cancel_event:'Annuler cette session ? Les participants en seront informés.',moderate_event:'Retirer cet événement de la carte ?',block:'Bloquer ce joueur ? Vos participations futures aux sessions de l’autre seront annulées.',remove_participant:'Retirer ce participant ? Sa place sera proposée à la liste d’attente.'};
    const dialog=$('utilityDialog');
    $('utilityContent').innerHTML=`<h2>Confirmer</h2><p>${esc(descriptions[action])}</p><form method="dialog" class="actions"><button class="ghost" value="cancel">Retour</button><button class="primary" value="confirm">Confirmer</button></form>`;
    dialog.returnValue='';
    return new Promise(resolve=>{dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true});dialog.showModal();});
  }
  function navigate(next){
    view=next;
    document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');});
    const discover=view==='discover';
    document.querySelector('.hero').hidden=!discover;
    document.querySelector('.filters').hidden=!discover;
    if(discover) setView('map'); else {$('mapView').classList.add('hidden');$('listView').classList.add('hidden');}
    $('communityPanel').hidden=discover;
    $('toggleView').hidden=!discover;
    renderPanel();
  }
  function card(e){
    const p=mine(e.id), count=snapshot.participations.filter(x=>x.event_id===e.id&&x.status==='accepted').length;
    return `<article class="social-card"><p class="eyebrow">${esc(e.sport)} · ${esc(date(e.starts_at))}</p><h3>${esc(e.title)}</h3><p>${esc(e.city)} · ${count}/${e.capacity} participants</p><p class="status">${e.cancelled?'Annulé':esc(labelStatus(p?.status))}${p?.confirmed?' · Présence confirmée':''}</p>${button('Ouvrir la session','detail',`data-id="${esc(e.id)}"`)}${p?.status==='accepted' && !p.confirmed && future(e) ? button('Toujours partant !','confirm',`data-event="${esc(e.id)}"`,'primary'):''}</article>`;
  }
  function profileCard(p){
    const friendship=snapshot.friendships.find(f=>f.sender===p.id||f.receiver===p.id);
    let actions='';
    if(friends().includes(p.id))actions=button('Retirer des amis','friend_remove',`data-user="${p.id}"`);
    else if(friendship?.receiver===uid())actions=button('Accepter','friend_accept',`data-user="${p.id}"`,'primary')+button('Refuser','friend_decline',`data-user="${p.id}"`);
    else if(friendship)actions=button('Annuler la demande','friend_remove',`data-user="${p.id}"`);
    else actions=button('Ajouter en ami','friend_request',`data-user="${p.id}"`,'primary');
    return `<article class="social-card"><div class="person-heading"><span class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</span><div><h3>${esc(p.name)}</h3><span>${esc(p.city)}</span></div></div><p>${esc(Object.entries(p.sports||{}).map(([s,l])=>s+' : '+l).join(' · '))}</p><p>${esc(p.availability)}</p><p>${esc(p.bio)}</p><div class="actions">${actions}${button('Signaler','report_user',`data-user="${p.id}"`)}${button('Bloquer','block',`data-user="${p.id}"`)}</div></article>`;
  }
  function renderPanel(){
    if(view==='discover')return;
    const panel=$('communityPanel');
    if(!uid()){panel.innerHTML=`<h2>Ta communauté sportive</h2><p>Connecte-toi pour retrouver tes activités, tes amis et tes groupes.</p>${button('Se connecter / créer un compte','auth','','primary')}`;return;}
    if(view==='activities'){
      const myEvents=snapshot.events.filter(e=>activityTab==='organizing'?e.organizer_id===uid():activityTab==='requests'?['pending','waitlisted'].includes(mine(e.id)?.status):mine(e.id)?.status==='accepted'&&future(e));
      panel.innerHTML=`<div class="panel-heading"><h2>Mes activités</h2>${button('Actualiser','refresh')}</div><div class="subtabs">${[['upcoming','À venir'],['requests','Mes demandes'],['organizing','J’organise']].map(([id,t])=>`<button class="ghost ${activityTab===id?'active':''}" data-activity="${id}">${t}</button>`).join('')}</div><div class="social-grid">${myEvents.map(card).join('')||empty('Aucune session pour le moment.')}</div>`;
    }else if(view==='friends'){
      const incoming=snapshot.friendships.filter(f=>f.receiver===uid()&&f.status==='pending');
      panel.innerHTML=`<h2>Amis & joueurs</h2><p>Retrouve tes partenaires, puis invite-les à ta prochaine session.</p><label>Rechercher un joueur<input type="search" id="peopleSearch" placeholder="Nom, ville ou sport"></label><h3>Demandes reçues (${incoming.length})</h3><div class="social-grid">${incoming.map(f=>person(f.sender)).filter(Boolean).map(profileCard).join('')||empty('Aucune demande en attente.')}</div><h3>Mes amis (${friends().length})</h3><div class="social-grid">${friends().map(person).filter(Boolean).map(profileCard).join('')||empty('Ajoute des joueurs pour constituer ton cercle.')}</div><h3>Rencontrer des joueurs</h3><div class="social-grid" id="peopleResults">${snapshot.profiles.filter(p=>p.id!==uid()&&!friends().includes(p.id)).map(profileCard).join('')||empty('Les nouveaux joueurs apparaîtront ici.')}</div>${snapshot.blocks.length?'<h3>Utilisateurs bloqués</h3>'+snapshot.blocks.map(b=>button('Débloquer ce joueur','unblock',`data-user="${b.target}"`)).join(''):''}`;
    }else if(view==='groups'){
      panel.innerHTML=`<div class="panel-heading"><h2>Mes groupes</h2>${button('Créer un groupe','new_group','','primary')}</div><div class="social-grid">${snapshot.groups.filter(g=>snapshot.members.some(m=>m.group_id===g.id&&m.user_id===uid())).map(g=>`<article class="social-card"><p class="eyebrow">${esc(g.sport)}</p><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p><p>${snapshot.members.filter(m=>m.group_id===g.id).map(m=>esc(name(m.user_id))).join(', ')}</p><div class="actions">${button('Créer une session','group_session',`data-id="${g.id}"`,'primary')}${g.owner===uid()?button('Inviter un ami','invite_group',`data-id="${g.id}"`):button('Quitter le groupe','group_leave',`data-group="${g.id}"`)}</div></article>`).join('')||empty('Crée un groupe pour ton équipe ou tes sorties habituelles.')}</div>`;
    }else if(view==='profile'){
      const p=person(uid())||{name:'',city:'',sports:{},availability:'',bio:''};
      panel.innerHTML=`<h2>Mon profil sportif</h2><form id="profileForm" class="profile-form"><div class="two-cols"><label>Prénom ou pseudo<input name="name" value="${esc(p.name)}" required minlength="2" maxlength="60"></label><label>Ville<input name="city" value="${esc(p.city)}" maxlength="100"></label></div><fieldset><legend>Sports et niveaux</legend>${['Running','Football','Tennis','Basket','Autre'].map(s=>`<label>${s}<input name="sport_${s}" value="${esc(p.sports?.[s]||'')}" placeholder="${s==='Running'?'Ex. 5:30 min/km sur 10 km':s==='Tennis'?'Ex. loisir ou classement':'Ton niveau (laisser vide si non pratiqué)'}" maxlength="100"></label>`).join('')}</fieldset><label>Disponibilités habituelles<input name="availability" value="${esc(p.availability)}" placeholder="Ex. mardi soir et dimanche matin" maxlength="500"></label><label>Quelques mots sur toi<textarea name="bio" maxlength="1000">${esc(p.bio)}</textarea></label><button class="primary">Enregistrer mon profil</button></form>${button('Se déconnecter','logout')}`;
    }else if(view==='notifications'){
      const invites=snapshot.invitations.filter(i=>i.receiver===uid()&&i.status==='pending');
      panel.innerHTML=`<div class="panel-heading"><h2>Invitations & nouvelles</h2>${button('Tout marquer comme lu','read_notifications')}</div>${invites.map(i=>`<article class="social-card"><h3>${esc(name(i.sender))} t’invite</h3><p>${esc(i.event_id?snapshot.events.find(e=>e.id===i.event_id)?.title||'Une session':snapshot.groups.find(g=>g.id===i.group_id)?.name||'Un groupe')}</p>${button('Accepter','invite_accept',`data-id="${i.id}"`,'primary')}${button('Décliner','invite_decline',`data-id="${i.id}"`)}</article>`).join('')}${snapshot.notifications.map(n=>`<article class="social-card"><p>${esc(n.body)}</p><small>${esc(date(n.created_at))}</small>${n.event_id?button('Voir la session','detail',`data-id="${n.event_id}"`):''}</article>`).join('')||(!invites.length?empty('Tu es à jour. Tes invitations et changements de participation apparaîtront ici.'):'')}`;
    }else if(view==='moderation'&&snapshot.moderator){
      panel.innerHTML=`<h2>Modération</h2><p>Signalements en attente de traitement.</p>${snapshot.reports.filter(r=>r.status==='open').map(r=>`<article class="social-card"><h3>${esc(r.event_id?snapshot.events.find(e=>e.id===r.event_id)?.title||'Événement':name(r.target))}</h3><p>${esc(r.reason)}</p><small>Signalé par ${esc(name(r.reporter))}</small><div class="actions">${button('Marquer comme traité','resolve_report',`data-id="${r.id}"`)}${r.event_id?button('Retirer l’événement','moderate_event',`data-event="${r.event_id}"`):''}</div></article>`).join('')||empty('Aucun signalement ouvert.')}`;
    }
    if(view==='notifications') {
      const preferences=readSaved('playlink-notifications',{});
      const city=Object.keys(cityCoordinates).find(c=>c.toLocaleLowerCase()===(preferences.city||'').trim().toLocaleLowerCase());
      const sports=(preferences.sports||'').toLocaleLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
      const nearby=city?snapshot.events.filter(e=>{
        const [lat,lng]=cityCoordinates[city], rad=Math.PI/180;
        const a=Math.sin((e.lat-lat)*rad/2)**2+Math.cos(lat*rad)*Math.cos(e.lat*rad)*Math.sin((e.lng-lng)*rad/2)**2;
        return future(e)&&e.organizer_id!==uid()&&6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)))<=parseInt(preferences.radius||'10')&&(!sports.length||sports.some(s=>e.sport.toLocaleLowerCase().includes(s)));
      }):[];
      const reminders=snapshot.events.filter(e=>future(e)&&new Date(e.starts_at)-Date.now()<86400000&&mine(e.id)?.status==='accepted'&&!mine(e.id)?.confirmed);
      panel.insertAdjacentHTML('beforeend',`<h3>Confirme ta présence pour demain</h3><div class="social-grid">${reminders.map(card).join('')||empty('Aucune présence à confirmer.')}</div><h3>Près de chez toi</h3><div class="social-grid">${nearby.map(card).join('')||empty(city?'Aucune session ne correspond à tes préférences.':'Renseigne une ville disponible dans « Mes alertes » pour retrouver les sessions proches.')}</div>`);
    }
  }
  function renderDetail(id){
    detailId=id;
    const e=snapshot.events.find(e=>e.id===id);
    if(!e){$('eventContent').innerHTML=empty('Cette session n’est plus accessible.');return;}
    const p=mine(id), owner=e.organizer_id===uid(), accepted=snapshot.participations.filter(x=>x.event_id===id&&x.status==='accepted');
    const waiting=snapshot.participations.filter(x=>x.event_id===id&&['pending','waitlisted'].includes(x.status));
    $('eventContent').innerHTML=`<p class="eyebrow">${esc(e.sport)} · ${esc({public:'Public',friends:'Amis uniquement',group:'Groupe'}[e.visibility])}</p><h2>${esc(e.title)}</h2><p>${esc(date(e.starts_at))}</p><p>${esc(e.location)} · ${esc(e.city)}</p><p>${esc(e.description)}</p><div class="details-grid">${Object.entries(e.details||{}).filter(([,v])=>v).map(([k,v])=>`<div><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`).join('')}</div><p>${esc(e.level)} · ${accepted.length}/${e.capacity} participants${e.series_id?' · Session récurrente':''}</p><p class="status">${e.cancelled?'Session annulée':esc(labelStatus(p?.status))}</p><div class="actions">${future(e)&&!owner?(!p||['cancelled','rejected'].includes(p.status)?button(accepted.length>=e.capacity?'Rejoindre la liste d’attente':e.join_mode==='approval'?'Demander une place':'Rejoindre','join',`data-event="${id}"`,'primary'):button('Me désister','leave',`data-event="${id}"`)):''}${p?.status==='accepted'&&!p.confirmed&&future(e)?button('Confirmer ma présence','confirm',`data-event="${id}"`,'primary'):''}${owner&&future(e)?button('Inviter mes amis','invite_event',`data-id="${id}"`)+button('Annuler cette session','cancel_event',`data-event="${id}"`):''}${button('Signaler cette session','report_event',`data-id="${id}"`)}</div><h3>Participants</h3>${accepted.map(x=>`<div class="member-row"><span>${esc(name(x.user_id))}${x.confirmed?' · confirmé':''}${x.user_id===e.organizer_id?' · organisateur':''}</span>${owner&&x.user_id!==uid()&&future(e)?button('Retirer','remove_participant',`data-event="${id}" data-user="${x.user_id}"`):''}</div>`).join('')}${owner&&waiting.length?'<h3>Demandes & liste d’attente</h3>'+waiting.map(x=>`<div class="member-row"><span>${esc(name(x.user_id))} · ${esc(labelStatus(x.status))}</span><div>${button('Accepter','approve',`data-event="${id}" data-user="${x.user_id}"`)}${button('Refuser','reject',`data-event="${id}" data-user="${x.user_id}"`)}</div></div>`).join(''):''}<h3>Discussion de la session</h3>${p?.status==='accepted'?`<div class="messages">${snapshot.messages.filter(m=>m.event_id===id).map(m=>`<div class="message"><strong>${esc(name(m.author))}</strong><small>${esc(date(m.created_at))}</small><p>${esc(m.body)}</p></div>`).join('')||empty('Précise le rendez-vous ou le matériel à apporter.')}</div>${!e.cancelled?`<form id="messageForm"><label>Ton message<textarea name="body" required maxlength="2000" rows="2"></textarea></label><button class="primary">Envoyer</button></form>`:''}`:'<p>La discussion est accessible aux participants acceptés.</p>'}`;
  }
  function openDetail(id){if(!uid()){openAuth();return;}renderDetail(id);$('eventDialog').showModal();}
  function openInvite(kind,id){
    $('utilityContent').innerHTML=`<h2>Inviter un ami</h2><form id="inviteForm"><input type="hidden" name="${kind}_id" value="${esc(id)}"><label>Ami<select name="user_id" required><option value="">Choisir un ami</option>${friends().map(f=>`<option value="${f}">${esc(name(f))}</option>`).join('')}</select></label><button class="primary">Envoyer l’invitation</button></form>`;$('utilityDialog').showModal();
  }
  function report(kind,id){$('utilityContent').innerHTML=`<h2>Signaler ${kind==='event'?'une session':'un utilisateur'}</h2><form id="reportForm"><input type="hidden" name="${kind==='event'?'event_id':'user_id'}" value="${esc(id)}"><label>Explique le problème<textarea name="reason" required minlength="5" maxlength="1000"></textarea></label><button class="primary">Transmettre à la modération</button></form>`;$('utilityDialog').showModal();}
  function prepareCreate(groupId){
    const select=$('createForm').elements.group_id;
    select.innerHTML='<option value="">Choisir un groupe</option>'+snapshot.groups.filter(g=>snapshot.members.some(m=>m.group_id===g.id&&m.user_id===uid())).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');
    if(groupId){select.value=groupId;$('createForm').elements.visibility.value='group';}
    sportsFields();
  }
  function sportsFields(){
    const sport=$('createForm').elements.sport.value;
    const fields=sport==='Running'?[['Distance','Ex. 10 km'],['Allure','Ex. 5:30 min/km']]:sport==='Tennis'?[['Surface','Ex. terre battue'],['Format','Simple ou double']]:sport==='Football'?[['Format','Ex. five 5 contre 5'],['Terrain','Intérieur ou extérieur']]:[['Format','Ex. match amical']];
    $('sportDetails').innerHTML=fields.map(([n,h])=>`<label>${n}<input name="detail_${n}" placeholder="${h}" maxlength="100"></label>`).join('')+'<label>Matériel à prévoir<input name="detail_Matériel" placeholder="Ex. ballon, eau, chaussures" maxlength="200"></label>';
  }
  async function createEvent(form){
    if(!uid()){openAuth();return false;}
    const data=Object.fromEntries(form), coords=cityCoordinates[data.city];
    if(!coords)throw new Error('Choisis une ville.');
    const details=Object.fromEntries(Object.entries(data).filter(([k])=>k.startsWith('detail_')).map(([k,v])=>[k.slice(7),v]));
    const result=await act('create_event',{...data,starts_at:new Date(`${data.date}T${data.time}`).toISOString(),lat:coords[0],lng:coords[1],capacity:Number(data.maxParticipants),join_mode:data.joinMode,occurrences:Number(data.occurrences),details});
    if(result){$('createDialog').close();$('createForm').reset();showToast('Session publiée.');navigate('activities');activityTab='organizing';renderPanel();}return true;
  }
  document.addEventListener('click',async ev=>{
    const tab=ev.target.closest('[data-view]');if(tab){navigate(tab.dataset.view);return;}
    const activity=ev.target.closest('[data-activity]');if(activity){activityTab=activity.dataset.activity;renderPanel();return;}
    const b=ev.target.closest('[data-action]');if(!b)return;
    const a=b.dataset.action;
    try{
      if(a==='auth'){if(uid())navigate('profile');else openAuth();return;}
      if(a==='detail'){openDetail(b.dataset.id);return;}
      if(a==='refresh'){await load();showToast('À jour.');return;}
      if(a==='logout'){await request('/auth/v1/logout',{method:'POST'});saveSession(null);await load();navigate('discover');return;}
      if(!uid()){openAuth();return;}
      if(a==='invite_event'||a==='invite_group'){openInvite(a==='invite_event'?'event':'group',b.dataset.id);return;}
      if(a==='report_event'||a==='report_user'){report(a==='report_event'?'event':'user',b.dataset.id||b.dataset.user);return;}
      if(a==='group_session'){prepareCreate(b.dataset.id);$('createDialog').showModal();return;}
      if(a==='new_group'){$('utilityContent').innerHTML='<h2>Créer un groupe</h2><form id="groupForm"><label>Nom<input name="name" required minlength="2" maxlength="80"></label><label>Sport<select name="sport"><option>Running</option><option>Football</option><option>Tennis</option><option>Basket</option><option>Multisport</option></select></label><label>Description<textarea name="description" maxlength="1000"></textarea></label><button class="primary">Créer le groupe</button></form>';$('utilityDialog').showModal();return;}
      if(['cancel_event','moderate_event','block','remove_participant'].includes(a)&&!await confirmAction(a))return;
      const result=await act(a,{user_id:b.dataset.user,event_id:b.dataset.event,group_id:b.dataset.group,id:b.dataset.id});
      if(result)showToast('Modification enregistrée.');
    }catch(error){showToast(error.message);}
  });
  document.addEventListener('submit',async ev=>{
    const id=ev.target.id;
    if(!['authForm','profileForm','messageForm','inviteForm','reportForm','groupForm'].includes(id))return;
    ev.preventDefault();const values=Object.fromEntries(new FormData(ev.target));const submit=ev.submitter; if(submit)submit.disabled=true;
    try{
      if(id==='authForm'){
        const signup=ev.submitter?.value==='signup';
        const result=await request(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:values.email,password:values.password,...(signup?{data:{name:values.name},gotrue_meta_security:{}}:{})})},false);
        if(result.access_token){saveSession(result);$('authDialog').close();await load();navigate('profile');showToast('Bienvenue sur PlayLink.');}
        else $('authFeedback').textContent='Vérifie tes e-mails pour confirmer ton compte, puis connecte-toi ici.';
      }else if(id==='profileForm'){const sports=Object.fromEntries(Object.entries(values).filter(([k,v])=>k.startsWith('sport_')&&v.trim()).map(([k,v])=>[k.slice(6),v]));await act('profile',{...values,sports});showToast('Profil enregistré.');}
      else if(id==='messageForm'){await act('message',{event_id:detailId,body:values.body});showToast('Message envoyé.');}
      else{const action={inviteForm:'invite',reportForm:'report',groupForm:'group_create'}[id];const result=await act(action,values);if(result){$('utilityDialog').close();showToast('Enregistré.');}}
    }catch(error){if(id==='authForm')$('authFeedback').textContent=error.message;else showToast(error.message);}
    finally{if(submit)submit.disabled=false;}
  });
  document.addEventListener('input',ev=>{if(ev.target.id==='peopleSearch'){const q=ev.target.value.toLocaleLowerCase();$('peopleResults').innerHTML=snapshot.profiles.filter(p=>p.id!==uid()&&JSON.stringify([p.name,p.city,p.sports]).toLocaleLowerCase().includes(q)).map(profileCard).join('')||empty('Aucun joueur trouvé.');}});
  $('createForm').elements.sport.addEventListener('change',sportsFields);
  $('openCreate').addEventListener('click',()=>{prepareCreate();if(!uid()){$('createDialog').close();openAuth();}});
  $('accountButton').addEventListener('click',()=>uid()?navigate('profile'):openAuth());
  $('notificationsButton').addEventListener('click',()=>navigate('notifications'));
  $('urgentOnly').addEventListener('change',render);
  const oldFilter=filteredEvents;
  filteredEvents=()=>oldFilter().filter(e=>!$('urgentOnly').checked||(e.maxParticipants-e.participants>0&&e.maxParticipants-e.participants<=2));
  const oldCard=eventCard;
  eventCard=e=>{
    if(!ready)return oldCard(e);
    const p=mine(e.id), left=e.maxParticipants-e.participants;
    return `<article class="card" data-sport="${esc(e.sport)}"><div class="card-top"><span class="sport">${esc(e.sport)}</span><span class="mode">${esc(e.visibility==='friends'?'Entre amis':e.visibility==='group'?'En groupe':modeLabel(e.joinMode))}</span></div><h3>${esc(e.title)}</h3><p class="event-date">${esc(date(e.starts_at))} · ${esc(e.city)}</p><p class="muted">${esc(e.level)} · Avec ${esc(e.organizer)}</p>${left>0&&left<=2?`<p class="urgent-tag">Il manque ${left} joueur${left>1?'s':''} !</p>`:''}<div class="card-footer"><small>${left>0?left+' place'+(left>1?'s':'')+' disponible'+(left>1?'s':''):'Complet · liste d’attente ouverte'}${p?' · '+esc(labelStatus(p.status)):''}</small>${button('Voir la session','detail',`data-id="${esc(e.id)}"`,'primary')}</div></article>`;
  };
  window.PlayLink={createEvent,ready,openDetail};
  renderAccount();
  if(ready){events=[];render();load().catch(error=>{$('connectionNotice').textContent='Connexion à PlayLink indisponible : '+error.message;showToast(error.message);});}
  setInterval(()=>{if(ready&&uid()&&!document.hidden&&!busy&&!['TEXTAREA','INPUT','SELECT'].includes(document.activeElement?.tagName))load().catch(()=>{});},30000);
})();
