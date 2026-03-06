import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { linesAPI, busesAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');
const NOUA = { latitude: 18.0735, longitude: -15.9582, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export default function DashboardScreen({ navigation }) {
  const { citizen } = useAuth();
  const [lines, setLines] = useState([]);
  const [buses, setBuses] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  useEffect(() => { requestLocation(); }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch {}
  };

  const fetchData = async () => {
    try {
      const [lRes, bRes] = await Promise.all([linesAPI.list(), busesAPI.live()]);
      setLines(Array.isArray(lRes.data) ? lRes.data : []);
      setBuses(Array.isArray(bRes.data) ? bRes.data : []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const activeBuses = buses.filter(b => b.gps);
  const initials = `${citizen?.prenom?.[0] || ''}${citizen?.nom?.[0] || ''}`.toUpperCase();

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[COLORS.primary]} />}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.name}>{citizen?.prenom} {citizen?.nom}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        </View>
      </View>

      {/* Wallet balance card */}
      <View style={[styles.walletCard, SHADOW.medium]}>
        <View style={styles.walletLeft}>
          <Text style={styles.walletLabel}>Solde Wallet</Text>
          <Text style={styles.walletBalance}>{parseFloat(citizen?.wallet_balance || 0).toLocaleString('fr-FR')} <Text style={styles.walletCurrency}>MRU</Text></Text>
        </View>
        <TouchableOpacity style={styles.rechargeBtn} onPress={() => navigation.navigate('Wallet')}>
          <Ionicons name="add-circle" size={18} color={COLORS.primary} />
          <Text style={styles.rechargeBtnText}>Recharger</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={[styles.mapCard, SHADOW.small]}>
        <View style={styles.mapHeader}>
          <Ionicons name="map-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Bus en temps réel</Text>
          <TouchableOpacity onPress={() => navigation.navigate('LiveMap')} style={styles.mapExpandBtn}>
            <Text style={styles.mapExpandText}>Agrandir</Text>
            <Ionicons name="expand-outline" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <MapView
          style={styles.map}
          initialRegion={userPos ? { ...userPos, latitudeDelta: 0.08, longitudeDelta: 0.08 } : NOUA}
          scrollEnabled={false} zoomEnabled={false} rotateEnabled={false}
        >
          {activeBuses.map(b => {
            const lineColor = b.lignes?.[0]?.couleur || COLORS.primary;
            return (
              <Marker key={b.id} coordinate={{ latitude: b.gps.latitude, longitude: b.gps.longitude }}
                title={`Bus ${b.numero_bus}`}
                description={b.lignes?.[0]?.nom || (b.chauffeur_nom ? `Chauffeur: ${b.chauffeur_nom}` : '')}
              >
                <View style={[styles.busMarkerWrap, { borderColor: lineColor }]}>
                  <Ionicons name="bus" size={11} color={lineColor} />
                  <Text style={[styles.busMarkerLabel, { color: lineColor }]}>{b.numero_bus}</Text>
                </View>
              </Marker>
            );
          })}
          {userPos && (
            <Marker coordinate={userPos} title="Ma position">
              <View style={styles.userMarker}><View style={styles.userMarkerInner} /></View>
            </Marker>
          )}
        </MapView>
        <View style={styles.mapFooter}>
          <Ionicons name="radio-button-on" size={12} color={COLORS.success} />
          <Text style={styles.mapFooterText}>{activeBuses.length} bus actif{activeBuses.length !== 1 ? 's' : ''} en ce moment</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickGrid}>
        {[
          { icon: 'list-outline', label: 'Lignes', color: COLORS.primary, screen: 'Lignes' },
          { icon: 'navigate-outline', label: 'Mon Trajet', color: COLORS.success, screen: 'ActiveTrip' },
          { icon: 'wallet-outline', label: 'Wallet', color: COLORS.accent, screen: 'Wallet' },
          { icon: 'time-outline', label: 'Historique', color: COLORS.warning, screen: 'History' },
        ].map(a => (
          <TouchableOpacity key={a.label} style={[styles.quickBtn, SHADOW.small]} onPress={() => navigation.navigate(a.screen)} activeOpacity={0.8}>
            <View style={[styles.quickIcon, { backgroundColor: a.color + '15' }]}>
              <Ionicons name={a.icon} size={24} color={a.color} />
            </View>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lines list */}
      <View style={styles.sectionHeader}>
        <Ionicons name="bus-outline" size={18} color={COLORS.dark} />
        <Text style={styles.sectionTitle}>Lignes populaires</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Lignes')}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {lines.slice(0, 4).map(l => (
        <TouchableOpacity key={l.id} style={[styles.lineCard, SHADOW.small]}
          onPress={() => navigation.navigate('LineDetail', { line: l })} activeOpacity={0.85}>
          <View style={[styles.lineCode, { backgroundColor: l.couleur || COLORS.primary }]}>
            <Text style={styles.lineCodeText}>{l.code}</Text>
          </View>
          <View style={styles.lineInfo}>
            <Text style={styles.lineName} numberOfLines={1}>{l.nom}</Text>
            <Text style={styles.lineRoute} numberOfLines={1}>{l.terminus_depart} → {l.terminus_arrivee}</Text>
          </View>
          <View style={styles.lineTarif}>
            <Text style={styles.lineTarifVal}>{parseFloat(l.tarif_base).toFixed(0)}</Text>
            <Text style={styles.lineTarifUnit}>MRU</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
        </TouchableOpacity>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  walletCard: { backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: -10, borderRadius: RADIUS.xl, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletLeft: {},
  walletLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  walletBalance: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 2 },
  walletCurrency: { fontSize: 14, fontWeight: '600' },
  rechargeBtn: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full },
  rechargeBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  mapCard: { backgroundColor: '#fff', margin: 16, borderRadius: RADIUS.xl, overflow: 'hidden' },
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
  mapExpandBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapExpandText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  map: { height: 180 },
  mapFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
  mapFooterText: { fontSize: 12, color: COLORS.gray },
  busMarker: { backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1.5, borderColor: COLORS.primary },
  busMarkerWrap: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 3 },
  busMarkerLabel: { fontSize: 10, fontWeight: '800' },
  userMarker: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(5,150,105,0.3)', alignItems: 'center', justifyContent: 'center' },
  userMarkerInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  quickBtn: { flex: 1, minWidth: '22%', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', gap: 8 },
  quickIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#0F172A', textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  seeAll: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  lineCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineCode: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lineCodeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  lineRoute: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  lineTarif: { alignItems: 'center' },
  lineTarifVal: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  lineTarifUnit: { fontSize: 10, color: COLORS.gray },
});
