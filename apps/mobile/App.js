import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, FlatList, Pressable, StyleSheet, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";

const EVENTS = [
  { id:"1", sport:"Running", title:"Running 10 km du dimanche", city:"Sceaux", date:"04/10 · 10:00", level:"Intermédiaire", mode:"Immédiat", places:"7/12" },
  { id:"2", sport:"Football", title:"Five 5v5 après le travail", city:"Palaiseau", date:"05/10 · 19:30", level:"Tous niveaux", mode:"Validation", places:"8/10" },
  { id:"3", sport:"Tennis", title:"Tennis simple - niveau loisir", city:"Massy", date:"06/10 · 18:00", level:"Loisir", mode:"Immédiat", places:"1/2" },
];

export default function App() {
  const [query, setQuery] = useState("");
  const list = useMemo(() => EVENTS.filter(e =>
    (e.title + " " + e.city + " " + e.sport).toLowerCase().includes(query.toLowerCase())
  ), [query]);

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>PlayLink</Text>
          <Text style={styles.subtitle}>Du sport, près de chez toi.</Text>
        </View>
        <Pressable style={styles.avatar}><Text style={styles.avatarText}>FL</Text></Pressable>
      </View>

      <Text style={styles.hero}>Trouve ton prochain sport.</Text>
      <TextInput
        style={styles.search}
        placeholder="Rechercher un sport ou une ville"
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.row}>
        <Pressable style={[styles.tab, styles.tabActive]}><Text style={styles.tabActiveText}>Liste</Text></Pressable>
        <Pressable style={styles.tab}><Text>Carte</Text></Pressable>
        <Pressable style={styles.tab}><Text>Alertes</Text></Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={item => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.sport}>{item.sport}</Text>
              <Text style={styles.mode}>{item.mode}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>📍 {item.city}  ·  📅 {item.date}</Text>
            <Text style={styles.meta}>🎯 {item.level}  ·  👥 {item.places}</Text>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>{item.mode === "Immédiat" ? "Rejoindre" : "Demander à participer"}</Text>
            </Pressable>
          </View>
        )}
      />

      <Pressable style={styles.fab}><Text style={styles.fabText}>＋</Text></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{ flex:1, backgroundColor:"#F6F7F9", paddingHorizontal:18 },
  header:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingTop:10, paddingBottom:18 },
  logo:{ fontSize:24, fontWeight:"800", color:"#111827" },
  subtitle:{ color:"#6B7280", marginTop:2 },
  avatar:{ width:42, height:42, borderRadius:14, backgroundColor:"#111827", alignItems:"center", justifyContent:"center" },
  avatarText:{ color:"white", fontWeight:"800" },
  hero:{ fontSize:36, lineHeight:39, fontWeight:"900", color:"#111827", marginBottom:16 },
  search:{ backgroundColor:"white", borderWidth:1, borderColor:"#E5E7EB", borderRadius:14, padding:14, marginBottom:12 },
  row:{ flexDirection:"row", gap:8, marginBottom:14 },
  tab:{ paddingVertical:10, paddingHorizontal:14, backgroundColor:"white", borderRadius:12, borderWidth:1, borderColor:"#E5E7EB" },
  tabActive:{ backgroundColor:"#111827" },
  tabActiveText:{ color:"white", fontWeight:"700" },
  card:{ backgroundColor:"white", borderWidth:1, borderColor:"#E5E7EB", borderRadius:18, padding:16 },
  cardTop:{ flexDirection:"row", justifyContent:"space-between" },
  sport:{ fontSize:12, fontWeight:"800", backgroundColor:"#F3F4F6", paddingVertical:5, paddingHorizontal:9, borderRadius:999 },
  mode:{ fontSize:12, color:"#6B7280" },
  title:{ fontSize:18, fontWeight:"800", marginTop:12, marginBottom:8 },
  meta:{ color:"#4B5563", marginBottom:5 },
  button:{ backgroundColor:"#111827", borderRadius:12, padding:12, marginTop:12, alignItems:"center" },
  buttonText:{ color:"white", fontWeight:"800" },
  fab:{ position:"absolute", right:20, bottom:26, width:58, height:58, borderRadius:18, backgroundColor:"#111827", alignItems:"center", justifyContent:"center" },
  fabText:{ color:"white", fontSize:30, lineHeight:32 }
});
