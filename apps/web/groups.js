/* Member-only group conversation and monthly session calendar. */
(() => {
 let data, user, current, month=new Date(new Date().getFullYear(),new Date().getMonth(),1), loading=false;
 const dialog=document.createElement('dialog');dialog.className='group-dialog';
 dialog.innerHTML='<div class="dialog-head"><h2 id="groupHeading"></h2><button type="button" class="icon" aria-label="Fermer le groupe">×</button></div><div id="groupCalendar"></div><h3>Discussion du groupe</h3><p class="muted">Visible uniquement par les membres. Les 100 derniers messages sont affichés.</p><div id="groupMessages" class="messages" aria-live="polite"></div><form id="groupMessageForm"><label>Ton message<textarea name="body" rows="3" maxlength="2000" required></textarea></label><button class="primary">Envoyer au groupe</button><p class="muted" id="groupMessageStatus" role="status"></p></form>';
 document.body.append(dialog);
 const find=id=>dialog.querySelector('#'+id);
 const esc=escapeHtml;
 const request=(path,opts)=>window.PlayLink.account.request(path,opts);
 function calendar(){
  const year=month.getFullYear(), m=month.getMonth(), offset=(new Date(year,m,1).getDay()+6)%7, days=new Date(year,m+1,0).getDate();
  const sessions=data.events.filter(e=>e.group_id===current.id).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
  find('groupCalendar').innerHTML=`<div class="group-month"><button class="ghost" data-month="-1" aria-label="Mois précédent">←</button><h3>${esc(month.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}))}</h3><button class="ghost" data-month="1" aria-label="Mois suivant">→</button></div><div class="group-calendar">${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>`<span class="weekday">${d}</span>`).join('')}${Array.from({length:offset},()=>'<div class="calendar-blank"></div>').join('')}${Array.from({length:days},(_,i)=>{const day=i+1, es=sessions.filter(e=>{const d=new Date(e.starts_at);return d.getFullYear()===year&&d.getMonth()===m&&d.getDate()===day;});return `<div class="calendar-day"><span>${day}</span>${es.map(e=>`<button type="button" data-session-id="${e.id}" class="calendar-session ${e.cancelled?'cancelled':''}" title="${esc(e.title)}">${esc(new Date(e.starts_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}))} ${esc(e.title)}${e.cancelled?' · Annulée':''}</button>`).join('')}</div>`;}).join('')}</div><p class="muted">Clique sur une session pour voir les détails et les participants.</p>${sessions.some(e=>{const d=new Date(e.starts_at);return d.getFullYear()===year&&d.getMonth()===m;})?'':'<p>Aucune session ce mois-ci.</p>'}`;
 }
 async function messages(){
  if(!current||loading)return; loading=true; const groupId=current.id;
  try{const rows=await request('/rest/v1/group_messages?group_id=eq.'+groupId+'&select=*&order=created_at.desc,id.desc&limit=100');if(!dialog.open||current.id!==groupId)return;
   find('groupMessages').innerHTML=rows.reverse().map(r=>`<div class="message"><strong>${esc(data.profiles.find(p=>p.id===r.author)?.name||'Sportif')}</strong><small>${esc(new Date(r.created_at).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}</small><p>${esc(r.body)}</p></div>`).join('')||'<p>La discussion est ouverte. Propose un rendez-vous à ton groupe.</p>';
  }catch(e){find('groupMessageStatus').textContent=e.message;}finally{loading=false;}
 }
 window.PlayLinkGroups={render(snapshot,uid){data=snapshot;user=uid;if(dialog.open){const g=data.groups.find(g=>g.id===current?.id&&data.members.some(m=>m.group_id===g.id&&m.user_id===user));if(!g){dialog.close();return;}current=g;calendar();}document.querySelectorAll('#communityPanel [data-action="group_session"]').forEach(b=>{if(b.parentElement.querySelector('[data-open-group]'))return;const btn=document.createElement('button');btn.type='button';btn.className='ghost';btn.textContent='Calendrier & discussion';btn.dataset.openGroup=b.dataset.id;b.parentElement.append(btn);});}};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-open-group]');if(!b)return;current=data.groups.find(g=>g.id===b.dataset.openGroup);if(!current)return;month=new Date(new Date().getFullYear(),new Date().getMonth(),1);find('groupHeading').textContent=current.name;find('groupMessageStatus').textContent='';dialog.querySelector('form').reset();find('groupMessages').textContent='Chargement…';calendar();dialog.showModal();messages();});
 dialog.querySelector('[aria-label="Fermer le groupe"]').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{const nav=e.target.closest('[data-month]');if(nav){month=new Date(month.getFullYear(),month.getMonth()+Number(nav.dataset.month),1);calendar();}const s=e.target.closest('[data-session-id]');if(s){dialog.close();window.PlayLink.openDetail(s.dataset.sessionId);}});
 dialog.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter,body=new FormData(e.target).get('body').trim();if(!body)return;btn.disabled=true;try{await request('/rest/v1/group_messages',{method:'POST',body:JSON.stringify({group_id:current.id,author:user,body})});e.target.reset();await messages();find('groupMessageStatus').textContent='Message envoyé.';}catch(error){find('groupMessageStatus').textContent=error.message;}finally{btn.disabled=false;}});
 setInterval(()=>{if(dialog.open&&!document.hidden)messages();},15000);
})();
