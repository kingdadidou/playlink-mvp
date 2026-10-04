/* IGN suggestions for French addresses and named places. */
(() => {
 const form=document.getElementById('createForm'),input=form.elements.location;
 const list=document.getElementById('addressSuggestions'),status=document.getElementById('addressFeedback');
 let timer,controller,revision=0,results=[],active=-1;
 function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function cancel(){clearTimeout(timer);controller?.abort();revision++;close();}
 function choose(i){const item=results[i];if(!item)return;cancel();results=[];input.value=item.fulltext;
  const city=form.elements.city;if(item.city){if(!Array.from(city.options).some(o=>o.value===item.city)){const option=document.createElement('option');option.value=item.city;option.textContent=item.city;city.append(option);}city.value=item.city;}
  window.PlayLinkLocation.choose(item.y,item.x);status.textContent='Adresse sélectionnée. Ajuste le point sur la carte si nécessaire.';input.focus();
 }
 function highlight(){Array.from(list.children).forEach((b,i)=>b.setAttribute('aria-selected',String(i===active)));if(active>=0){input.setAttribute('aria-activedescendant',`addressOption${active}`);list.children[active]?.scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');}
 async function search(text,ticket){controller=new AbortController();const signal=controller.signal;const timeout=setTimeout(()=>controller?.signal===signal&&controller.abort(),8000);
  status.textContent='Recherche d’adresses…';
  try{const params=new URLSearchParams({text,type:'StreetAddress,PositionOfInterest',maximumResponses:'6'});const center=typeof cityCoordinates!=='undefined'?cityCoordinates[form.elements.city.value]:null;if(center)params.set('lonlat',`${center[1]},${center[0]}`);
   const response=await fetch('https://data.geopf.fr/geocodage/completion/?'+params,{signal});if(!response.ok)throw new Error('Service indisponible');const data=await response.json();if(ticket!==revision)return;
   results=(data.results||[]).filter(r=>typeof r.fulltext==='string'&&Number.isFinite(r.x)&&Number.isFinite(r.y)&&Math.abs(r.x)<=180&&Math.abs(r.y)<=90).slice(0,6);list.replaceChildren();
   results.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.id=`addressOption${i}`;b.setAttribute('role','option');b.setAttribute('aria-selected','false');b.tabIndex=-1;b.textContent=r.fulltext;b.addEventListener('click',()=>choose(i));list.append(b);});
   list.hidden=!results.length;input.setAttribute('aria-expanded',String(results.length>0));status.textContent=results.length?'Choisis une suggestion ou précise ta recherche.':'Aucun résultat. Précise l’adresse ou place directement le point sur la carte.';
  }catch(error){if(ticket!==revision)return;close();status.textContent='Suggestions indisponibles. Saisis l’adresse et place le point sur la carte.';}finally{clearTimeout(timeout);}
 }
 input.addEventListener('input',()=>{cancel();results=[];window.PlayLinkLocation.clear();const text=input.value.trim();if(text.length<3){status.textContent='Saisis au moins 3 caractères pour rechercher une adresse ou un lieu.';return;}const ticket=revision;timer=setTimeout(()=>search(text,ticket),350);});
 input.addEventListener('keydown',e=>{if(e.key==='Escape'){cancel();return;}if(list.hidden)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+results.length)%results.length;highlight();}else if(e.key==='Enter'){e.preventDefault();choose(active>=0?active:0);}});
 input.addEventListener('blur',()=>setTimeout(()=>{if(document.activeElement!==input)close();},180));
 input.addEventListener('focus',()=>{if(results.length){list.hidden=false;input.setAttribute('aria-expanded','true');}});
 form.addEventListener('reset',()=>{cancel();results=[];list.replaceChildren();status.textContent='Recherche d’adresses et de lieux en France · IGN';});
})();
