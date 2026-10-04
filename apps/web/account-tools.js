(() => {
 const api=window.PlayLink.account,dialog=document.getElementById('utilityDialog'),content=document.getElementById('utilityContent');
 function open(html){content.innerHTML=html;if(!dialog.open)dialog.showModal();}
 const resetUrl=location.origin+'/';
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-account]');if(!b)return;
  if(b.dataset.account==='recover')open('<h2>Mot de passe oublié</h2><form id="recoverForm"><label>E-mail<input name="email" type="email" required autocomplete="email"></label><button class="primary">Recevoir un lien</button><p role="status" id="accountFeedback"></p></form>');
  if(b.dataset.account==='delete')open('<h2>Supprimer mon compte</h2><p>Cette action est définitive. Ton profil, tes messages et tes événements seront supprimés. Les participants seront prévenus. Tes groupes seront transmis à un membre restant lorsque c’est possible.</p><form id="deleteAccountForm"><label>Écris SUPPRIMER pour confirmer<input name="confirmation" required pattern="SUPPRIMER" autocomplete="off"></label><button class="primary">Supprimer définitivement mon compte</button><p role="status" id="accountFeedback"></p></form>');
 });
 document.addEventListener('submit',async e=>{
  if(!['recoverForm','newPasswordForm','deleteAccountForm'].includes(e.target.id))return;e.preventDefault();const form=e.target,values=Object.fromEntries(new FormData(form)),button=e.submitter;button.disabled=true;
  try{
   if(form.id==='recoverForm'){await api.request('/auth/v1/recover?redirect_to='+encodeURIComponent(resetUrl),{method:'POST',body:JSON.stringify({email:values.email})},false);document.getElementById('accountFeedback').textContent='Si cette adresse possède un compte, un lien de récupération sera envoyé. Vérifie aussi les indésirables.';}
   else if(form.id==='newPasswordForm'){if(values.password!==values.repeat)throw new Error('Les deux mots de passe doivent être identiques.');await api.request('/auth/v1/user',{method:'PUT',body:JSON.stringify({password:values.password})});dialog.close();showToast('Mot de passe enregistré.');}
   else{await api.request('/rest/v1/rpc/delete_my_account',{method:'POST',body:JSON.stringify({confirmation:values.confirmation})});api.saveSession(null);dialog.close();await api.load();api.navigate('discover');showToast('Ton compte a été supprimé.');}
  }catch(error){document.getElementById('accountFeedback').textContent=error.message;}finally{button.disabled=false;}
 });
 async function recovery(){const hash=new URLSearchParams(location.hash.slice(1));if(hash.get('type')!=='recovery'||!hash.get('access_token'))return;
  const access_token=hash.get('access_token'),refresh_token=hash.get('refresh_token');history.replaceState(null,'',location.pathname);
  try{const user=await api.request('/auth/v1/user',{headers:{Authorization:'Bearer '+access_token}},false);api.saveSession({access_token,refresh_token,user,expires_in:Number(hash.get('expires_in')||3600)});await api.load();open('<h2>Choisir un nouveau mot de passe</h2><form id="newPasswordForm"><label>Nouveau mot de passe<input name="password" type="password" minlength="8" required autocomplete="new-password"></label><label>Confirmer le mot de passe<input name="repeat" type="password" minlength="8" required autocomplete="new-password"></label><button class="primary">Enregistrer</button><p id="accountFeedback" role="status"></p></form>');}
  catch{showToast('Lien expiré. Demande un nouveau lien de récupération.');}
 }
 recovery();
 if(new URLSearchParams(location.search).has('recover'))open('<h2>Mot de passe oublié</h2><form id="recoverForm"><label>E-mail<input name="email" type="email" required autocomplete="email"></label><button class="primary">Recevoir un lien</button><p role="status" id="accountFeedback"></p></form>');
 if(new URLSearchParams(location.search).has('delete-account')){api.navigate('profile');showToast('Connecte-toi puis utilise « Supprimer mon compte » dans ton profil.');}
})();
