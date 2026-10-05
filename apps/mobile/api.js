import * as SecureStore from 'expo-secure-store';

const URL='https://sugtwrzvpaidmvpeyvju.supabase.co';
const KEY='sb_publishable_ZbaVSERQ_GV1VAp-UkWc9w_sfnxHiyh';
let session=null,refreshing=null;
export const currentUser=()=>session?.user;
async function save(value){
  session=value?{access_token:value.access_token,refresh_token:value.refresh_token,expires_at:value.expires_at||Date.now()/1000+(value.expires_in||3600),user:{id:value.user.id}}:null;
  if(session)await SecureStore.setItemAsync('playlink.session',JSON.stringify(session));else await SecureStore.deleteItemAsync('playlink.session');
}
export async function restore(){const raw=await SecureStore.getItemAsync('playlink.session');try{session=raw?JSON.parse(raw):null;}catch{await save(null);}return session;}
async function request(path,body,authorized=true,method){
  if(authorized&&session&&Date.now()/1000>session.expires_at-60){
    if(!refreshing)refreshing=request('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token},false).then(save).catch(async()=>{await save(null);throw new Error('Session expirée. Reconnecte-toi.');}).finally(()=>{refreshing=null;});
    await refreshing;
  }
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(URL+path,{method:method||(body?'POST':'GET'),headers:{apikey:KEY,'Content-Type':'application/json',...(authorized&&session?{Authorization:`Bearer ${session.access_token}`}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.message||data.msg||data.error_description||'Action impossible. Réessaie.');
    return data;
  }catch(error){if(error.name==='AbortError')throw new Error('Connexion trop lente. Vérifie ton réseau.');throw error;}finally{clearTimeout(timeout);}
}
export async function authenticate(email,password,name,signup){const data=await request(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{email:email.trim(),password,...(signup?{data:{name}}:{})},false);if(data.access_token)await save(data);return !!data.access_token;}
export async function logout(){try{await request('/auth/v1/logout',{},true);}catch{}finally{await save(null);}}
export async function load(){
  if(session)return request('/rest/v1/rpc/snapshot',{});
  const [events,participations]=await Promise.all([request('/rest/v1/events?select=*&cancelled=eq.false&order=starts_at',null,false),request('/rest/v1/participations?select=event_id,status',null,false)]);
  return {events,participations,profiles:[],friendships:[],groups:[],members:[],invitations:[],messages:[],reports:[],blocks:[],notifications:[]};
}
export async function action(action,data={}){if(!session)throw new Error('Connecte-toi pour continuer.');return request('/rest/v1/rpc/playlink_action',{action,data});}
export async function rpc(name,body){if(!session)throw new Error('Connecte-toi pour continuer.');return request('/rest/v1/rpc/'+name,body);}
export const saveProfile=data=>rpc('save_profile',{data});
export const recover=email=>request('/auth/v1/recover?redirect_to='+encodeURIComponent('https://playlink-mvp.vercel.app/'),{email:email.trim()},false);
export async function deleteAccount(){await rpc('delete_my_account',{confirmation:'SUPPRIMER'});await save(null);}
export const chatMessages=(kind,id)=>request('/rest/v1/'+(kind==='group'?'group_messages':'messages')+'?select=*&'+(kind==='group'?'group_id':'event_id')+'=eq.'+encodeURIComponent(id)+'&order=created_at.desc&limit=100');
export const sendChat=(kind,id,body)=>kind==='group'?request('/rest/v1/group_messages',{group_id:id,author:currentUser().id,body}):action('message',{event_id:id,body});
export function subscribeChat(kind,id,onChange,onStatus){
  let socket,heartbeat,retry,stopped=false;
  const connect=()=>{
    if(stopped||!session)return;
    const topic='realtime:mobile-'+kind+'-'+id;
    onStatus('Connexion…');
    socket=new WebSocket(URL.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(KEY)+'&vsn=1.0.0');
    socket.onopen=()=>{socket.send(JSON.stringify({topic,event:'phx_join',ref:'1',payload:{access_token:session.access_token,config:{broadcast:{self:false},presence:{key:''},postgres_changes:[{event:'INSERT',schema:'public',table:kind==='group'?'group_messages':'messages',filter:(kind==='group'?'group_id':'event_id')+'=eq.'+id}]}}}));heartbeat=setInterval(()=>{if(socket.readyState===1)socket.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(Date.now())}));},25000);};
    socket.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.event==='postgres_changes')onChange();if(m.event==='phx_reply'&&m.ref==='1'){onStatus(m.payload.status==='ok'?'Chat en direct':'Reconnexion…');if(m.payload.status!=='ok')socket.close();}}catch{}};
    socket.onclose=()=>{clearInterval(heartbeat);if(!stopped){onStatus('Reconnexion…');retry=setTimeout(async()=>{try{await onChange();}finally{connect();}},3000);}};
  };
  connect();return()=>{stopped=true;clearInterval(heartbeat);clearTimeout(retry);if(socket){socket.onclose=null;socket.close();}};
}
