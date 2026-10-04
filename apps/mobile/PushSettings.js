import React,{useState} from 'react';
import {Alert,Platform,Pressable,Text,View} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import {rpc} from './api';
const projectId='0bee99b0-cace-4454-9f86-bf1358d869c5';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
export async function unregisterPush(){const token=await SecureStore.getItemAsync('playlink.push');if(token){await rpc('register_push',{token,enabled:false});await SecureStore.deleteItemAsync('playlink.push');}}
export default function PushSettings(){const [busy,setBusy]=useState(false);
 async function enable(){setBusy(true);try{if(!Device.isDevice)throw new Error('Les notifications doivent être testées sur un téléphone réel.');if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('default',{name:'PlayLink',importance:Notifications.AndroidImportance.HIGH});const permission=await Notifications.requestPermissionsAsync();if(permission.status!=='granted')throw new Error('Autorise les notifications dans les réglages du téléphone pour les recevoir.');const {data:token}=await Notifications.getExpoPushTokenAsync({projectId});await rpc('register_push',{token,enabled:true});await SecureStore.setItemAsync('playlink.push',token);Alert.alert('Notifications activées','Tu recevras les nouvelles invitations et changements de tes sessions.');}catch(e){Alert.alert('Notifications',e.message);}finally{setBusy(false);}}
 const button=(title,onPress)=><Pressable accessibilityRole="button" disabled={busy} style={{borderWidth:1,borderColor:'#aebaa6',padding:14,borderRadius:6,marginVertical:6}} onPress={onPress}><Text style={{color:'#174c3e',fontWeight:'600'}}>{title}</Text></Pressable>;
 return <View style={{marginVertical:16}}><Text>Notifications sur ce téléphone</Text>{button('Activer les notifications',enable)}{button('Désactiver les envois',async()=>{setBusy(true);try{await unregisterPush();Alert.alert('Envois désactivés');}catch(e){Alert.alert('Notifications',e.message);}finally{setBusy(false);}})}</View>;
}
