/* Selected sports, optional levels and bounded profile photos. */
(() => {
 const sports='Running|Trail|Marche|Randonnée|Marche nordique|Athlétisme|Football|Five|Futsal|Tennis|Padel|Badminton|Squash|Tennis de table|Pickleball|Basket|Basket 3x3|Volley-ball|Beach-volley|Handball|Rugby|Touch rugby|Hockey sur gazon|Hockey sur glace|Baseball|Softball|Ultimate|Football américain|Flag football|Cricket|Golf|Mini-golf|Pétanque|Bowling|Billard|Fléchettes|Cyclisme sur route|VTT|BMX|Gravel|Vélo urbain|Natation|Eau libre|Aquagym|Water-polo|Triathlon|Duathlon|Swimrun|Surf|Bodyboard|Paddle|Kayak|Canoë|Aviron|Voile|Planche à voile|Kitesurf|Plongée|Apnée|Escalade|Bloc|Via ferrata|Alpinisme|Ski alpin|Ski de fond|Ski de randonnée|Snowboard|Raquettes à neige|Patinage|Roller|Skateboard|Trottinette freestyle|Musculation|Fitness|Cross-training|Calisthenics|Haltérophilie|Force athlétique|Yoga|Pilates|Stretching|Danse|Danse de salon|Hip-hop|Zumba|Gymnastique|Trampoline|Parkour|Boxe anglaise|Boxe française|Kick-boxing|Muay-thaï|MMA|Judo|Karaté|Taekwondo|Jiu-jitsu brésilien|Aïkido|Lutte|Krav-maga|Tai-chi|Escrime|Tir à l’arc|Équitation|Course d’orientation|Raid multisport|Disc golf|Roundnet|Boccia|Goalball|Basket fauteuil|Rugby fauteuil|Autre'.split('|').sort((a,b)=>a.localeCompare(b,'fr'));
 const levels=['Non renseigné','Débutant','Intermédiaire','Confirmé','Compétition'];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safePhoto=s=>typeof s==='string'&&s.length<=60000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s);
 const avatar=(p,large=false)=>`<span class="avatar ${large?'avatar-large':''}">${safePhoto(p.avatar)?`<img src="${p.avatar}" alt="Photo de ${esc(p.name)}">`:esc((p.name||'P').slice(0,1).toUpperCase())}</span>`;
 function mount(form,p){
  let photo=p.avatar||'',processing=false,version=0;
  const selected={...(p.sports||{})};
  const area=document.createElement('fieldset');
  area.innerHTML=`<legend>Sports et niveaux</legend><p class="muted">Ajoute les sports que tu pratiques. Le niveau est facultatif pour chaque sport.</p><div class="sport-add"><label>Choisir un sport<select id="profileSport"></select></label><button type="button" id="addProfileSport" class="ghost">Ajouter</button></div><div id="profileSports"></div><p id="sportFeedback" role="status"></p>`;
  form.querySelector('fieldset').replaceWith(area);
  const selector=area.querySelector('select'),rows=area.querySelector('#profileSports'),feedback=area.querySelector('#sportFeedback');
  function render(){
   selector.innerHTML='<option value="">Sélectionner un sport</option>'+sports.filter(s=>!(s in selected)).map(s=>`<option>${esc(s)}</option>`).join('');
   rows.innerHTML=Object.entries(selected).map(([s,l],i)=>`<div class="profile-sport-row"><label for="sportLevel${i}">${esc(s)}</label><select id="sportLevel${i}" data-sport="${esc(s)}" aria-label="Niveau en ${esc(s)}">${[...levels,...(l&&!levels.includes(l)?[l]:[])].map(v=>`<option ${v===(l||'Non renseigné')?'selected':''}>${esc(v)}</option>`).join('')}</select><button type="button" class="ghost" data-remove-sport="${esc(s)}" aria-label="Retirer ${esc(s)}">Retirer</button></div>`).join('')||'<p class="muted">Aucun sport ajouté pour le moment.</p>';
  }
  area.querySelector('#addProfileSport').onclick=()=>{if(!selector.value){feedback.textContent='Choisis un sport dans la liste.';selector.focus();return;}const s=selector.value;selected[s]='Non renseigné';render();feedback.textContent=s+' ajouté.';selector.focus();};
  rows.onchange=e=>{if(e.target.dataset.sport)selected[e.target.dataset.sport]=e.target.value;};
  rows.onclick=e=>{const b=e.target.closest('[data-remove-sport]');if(b){delete selected[b.dataset.removeSport];render();selector.focus();}};
  render();
  const photoBox=document.createElement('fieldset');photoBox.innerHTML=`<legend>Photo de profil</legend><div id="avatarPreview"></div><label>Choisir une photo<input id="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp"></label><p class="muted">JPG, PNG ou WebP, 10 Mo maximum. Recadrage au centre. Visible par les joueurs qui peuvent consulter ton profil.</p><button type="button" class="ghost" id="removePhoto">Supprimer la photo</button><p id="photoFeedback" role="status"></p>`;
  form.prepend(photoBox);
  const preview=photoBox.querySelector('#avatarPreview'),status=photoBox.querySelector('#photoFeedback'),file=photoBox.querySelector('input');
  const show=()=>{preview.innerHTML=avatar({...p,avatar:photo},true);photoBox.querySelector('#removePhoto').disabled=!photo;};show();
  photoBox.querySelector('#removePhoto').onclick=()=>{version++;processing=false;photo='';file.value='';status.textContent='La photo sera supprimée à l’enregistrement.';show();};
  file.onchange=async()=>{const f=file.files[0];if(!f)return;const ticket=++version;processing=true;status.textContent='Préparation de la photo…';let url;
   try{if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024)throw new Error('Choisis une image JPG, PNG ou WebP de moins de 10 Mo.');
    url=URL.createObjectURL(f);const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,192,192);const side=Math.min(img.width,img.height);ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,192,192);const result=canvas.toDataURL('image/jpeg',0.78);if(!safePhoto(result))throw new Error('Photo trop volumineuse. Choisis une autre image.');if(ticket!==version)return;photo=result;show();status.textContent='Photo prête. Enregistre ton profil pour la conserver.';
   }catch(err){if(ticket===version){status.textContent=err.message||'Image illisible.';file.value='';}}finally{if(url)URL.revokeObjectURL(url);if(ticket===version)processing=false;}
  };
  form.readProfile=()=>{if(processing)throw new Error('La photo est encore en préparation.');return {sports:{...selected},avatar:photo};};
 }
 window.PlayLinkProfile={mount,avatar,sports,levels,safePhoto};
})();
