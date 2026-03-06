import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { tripAPI, gpsAPI } from '../utils/api';
import { COLORS, SHADOW, RADIUS } from '../utils/theme';

const { width } = Dimensions.get('window');
const NOUA = { latitude: 18.0735, longitude: -15.9582 };

export default function DashboardScreen({ navigation }) {
  const { driver } = useAuth();
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setDriverPos(pos);
        // Post initial GPS — backend auto-detects bus from driver token
        const gpsPayload = { latitude: pos.latitude, longitude: pos.longitude };
        if (driver.bus?.id) gpsPayload.bus_id = driver.bus.id;
        gpsAPI.post(gpsPayload).catch(() => {});

        // Keep posting GPS every 30s while on dashboard
        const gpsInterval = setInterval(async () => {
          try {
            const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const p = { latitude: l.coords.latitude, longitude: l.coords.longitude };
            setDriverPos(p);
            const payload = { latitude: p.latitude, longitude: p.longitude, vitesse_kmh: Math.round((l.coords.speed || 0) * 3.6) };
            if (driver.bus?.id) payload.bus_id = driver.bus.id;
            gpsAPI.post(payload).catch(() => {});
          } catch {}
        }, 30000);
        return () => clearInterval(gpsInterval);
      }
    } catch {}
  };

  const fetchData = async () => {
    try {
      const res = await tripAPI.list();
      const all = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setTrips(all);
      setActiveTrip(all.find((t) => t.statut === 'EN_COURS') || null);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleStartTrip = async () => {
    if (!driver.bus) {
      Alert.alert('Aucun bus assigné', 'Contactez l\'administration pour qu\'un bus vous soit assigné.');
      return;
    }
    Alert.alert(
      'Démarrer le trajet ?',
      `🚌 Bus ${driver.bus.numero_bus}\n${driver.bus.lignes?.[0]?.nom || 'Aucune ligne assignée'}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: async () => {
            setStarting(true);
            try {
              const res = await tripAPI.create({
                bus_id: driver.bus.id,
                ligne_id: driver.bus.lignes?.[0]?.id || null,
              });
              const newTrip = res.data;
              setActiveTrip(newTrip);
              navigation.navigate('Trip', { trip: newTrip });
            } catch (err) {
              Alert.alert('Erreur', err.response?.data?.detail || 'Impossible de démarrer le trajet');
            } finally {
              setStarting(false);
            }
          },
        },
      ]
    );
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const today = new Date().toDateString();
  const todayTrips = trips.filter((t) => new Date(t.date_debut).toDateString() === today);
  const todayRevenue = todayTrips.reduce((s, t) => s + parseFloat(t.revenus || 0), 0);
  const todayPassengers = todayTrips.reduce((s, t) => s + (t.nombre_passagers || 0), 0);

  const line = driver.bus?.lignes?.[0];
  const mapRegion = driverPos
    ? { ...driverPos, latitudeDelta: 0.018, longitudeDelta: 0.018 }
    : { ...NOUA, latitudeDelta: 0.04, longitudeDelta: 0.04 };

  if (loading) {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.driverName}>{driver.prenom} {driver.nom}</Text>
          <Text style={styles.matriculeBadge}>{driver.matricule}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{driver.prenom?.[0]}{driver.nom?.[0]}</Text>
          </View>
        </View>
      </View>

      {/* ── Active trip banner ── */}
      {activeTrip && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => navigation.navigate('Trip', { trip: activeTrip })}
          activeOpacity={0.85}
        >
          <View style={styles.pulseDot} />
          <Text style={styles.activeBannerText}>Trajet en cours — Appuyez pour continuer</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── Bus card ── */}
      <View style={[styles.busCard, SHADOW.medium]}>
        <View style={styles.busCardTop}>
          <View style={styles.busIconWrap}>
            <Ionicons name="bus" size={30} color={driver.bus ? COLORS.primary : COLORS.lightGray} />
          </View>
          <View style={styles.busInfo}>
            {driver.bus ? (
              <>
                <Text style={styles.busNumber}>Bus {driver.bus.numero_bus}</Text>
                <Text style={styles.busDriver}>{driver.prenom} {driver.nom}</Text>
                {driver.bus.marque ? (
                  <Text style={styles.busDetail}>{driver.bus.marque} {driver.bus.modele} · {driver.bus.capacite} places</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.noBusText}>Aucun bus assigné</Text>
            )}
          </View>
          <View style={[styles.statusPill, { backgroundColor: driver.is_online ? COLORS.success + '20' : '#F1F5F9' }]}>
            <View style={[styles.statusDot, { backgroundColor: driver.is_online ? COLORS.success : COLORS.lightGray }]} />
            <Text style={[styles.statusText, { color: driver.is_online ? COLORS.success : COLORS.lightGray }]}>
              {driver.is_online ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </View>
        {line ? (
          <View style={[styles.lineChip, { backgroundColor: line.couleur || COLORS.primary }]}>
            <Ionicons name="git-branch-outline" size={13} color="#fff" />
            <Text style={styles.lineChipText}>{line.code} — {line.nom}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Start button ── */}
      {!activeTrip ? (
        <TouchableOpacity
          style={[styles.startBtn, (starting || !driver.bus) && styles.startBtnDim]}
          onPress={handleStartTrip}
          disabled={starting || !driver.bus}
          activeOpacity={0.85}
        >
          {starting ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <View style={styles.startIconWrap}>
                <Ionicons name="play-circle" size={48} color="#fff" />
              </View>
              <View>
                <Text style={styles.startBtnLabel}>DÉMARRER TRAJET</Text>
                <Text style={styles.startBtnSub}>
                  {driver.bus ? `Bus ${driver.bus.numero_bus} · ${line?.nom || 'Aucune ligne'}` : 'Aucun bus assigné'}
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.navigate('Trip', { trip: activeTrip })}
        >
          <Ionicons name="navigate" size={22} color="#fff" />
          <Text style={styles.continueBtnText}>Continuer le trajet en cours</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <StatCard icon="repeat" value={todayTrips.length} label="Trajets du jour" color={COLORS.primary} />
        <StatCard icon="cash-outline" value={`${Math.round(todayRevenue).toLocaleString('fr-FR')}`} label="MRU gagnés" color={COLORS.success} />
        <StatCard icon="people-outline" value={todayPassengers} label="Passagers" color={COLORS.warning} />
      </View>

      {/* ── Mini map ── */}
      <View style={[styles.mapCard, SHADOW.small]}>
        <View style={styles.mapHeader}>
          <Ionicons name="map-outline" size={16} color={COLORS.primary} />
          <Text style={styles.mapTitle}>Ma Position</Text>
          <View style={[styles.gpsBadge, { backgroundColor: driverPos ? COLORS.success + '15' : '#F1F5F9' }]}>
            <View style={[styles.gpsDot, { backgroundColor: driverPos ? COLORS.success : COLORS.lightGray }]} />
            <Text style={[styles.gpsText, { color: driverPos ? COLORS.success : COLORS.lightGray }]}>
              {driverPos ? 'GPS actif' : 'GPS inactif'}
            </Text>
          </View>
        </View>
        <MapView
          style={styles.miniMap}
          region={mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
        >
          {driverPos && (
            <Marker coordinate={driverPos}>
              <View style={styles.mapMarker}>
                <Ionicons name="bus" size={14} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* ── Quick actions ── */}
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.quickGrid}>
        <QuickBtn icon="warning-outline" label="Signaler" color={COLORS.warning} onPress={() => navigation.navigate('Report')} />
        <QuickBtn icon="time-outline" label="Mes Trajets" color={COLORS.primary} onPress={() => navigation.navigate('Trajets')} />
        <QuickBtn icon="cash-outline" label="Revenus" color={COLORS.success} onPress={() => navigation.navigate('Revenus')} />
        <QuickBtn icon="notifications-outline" label="Messages" color={COLORS.accent} onPress={() => navigation.navigate('Notifications')} />
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[styles.statCard, SHADOW.small]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickBtn({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.quickBtn, SHADOW.small]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.gray },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16, paddingTop: 8,
  },
  headerLeft: {},
  greeting: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  driverName: { fontSize: 21, fontWeight: '700', color: COLORS.dark, marginTop: 1 },
  matriculeBadge: { fontSize: 12, color: COLORS.lightGray, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...SHADOW.small,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Active banner
  activeBanner: {
    backgroundColor: COLORS.success, borderRadius: RADIUS.md, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
    shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  activeBannerText: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 },

  // Bus card
  busCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 18, marginBottom: 16,
  },
  busCardTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  busIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center',
  },
  busInfo: { flex: 1 },
  busNumber: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  busDriver: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  busDetail: { fontSize: 11, color: COLORS.lightGray, marginTop: 2 },
  noBusText: { fontSize: 15, color: COLORS.lightGray, fontStyle: 'italic' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  lineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  lineChipText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Start button
  startBtn: {
    backgroundColor: COLORS.success, borderRadius: RADIUS.xl,
    paddingVertical: 22, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 20,
    shadowColor: COLORS.success, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  startBtnDim: { opacity: 0.55 },
  startIconWrap: {},
  startBtnLabel: { fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  startBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

  continueBtn: {
    backgroundColor: COLORS.warning, borderRadius: RADIUS.xl,
    paddingVertical: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 20,
    shadowColor: COLORS.warning, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  continueBtnText: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.lg,
    padding: 14, alignItems: 'center', gap: 6,
  },
  statIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.gray, textAlign: 'center', lineHeight: 14 },

  // Mini map
  mapCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl,
    overflow: 'hidden', marginBottom: 20,
  },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  mapTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.dark },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  gpsDot: { width: 6, height: 6, borderRadius: 3 },
  gpsText: { fontSize: 11, fontWeight: '600' },
  miniMap: { height: 190, width: '100%' },
  mapMarker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },

  // Quick actions
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickBtn: {
    width: (width - 44) / 2, backgroundColor: '#fff',
    borderRadius: RADIUS.xl, padding: 16, alignItems: 'center', gap: 10,
  },
  quickIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
});
