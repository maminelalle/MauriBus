import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { tripTrackingAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');
const NOUA = { latitude: 18.0735, longitude: -15.9582, latitudeDelta: 0.05, longitudeDelta: 0.05 };
const POLL_INTERVAL = 8000; // 8 seconds

export default function ActiveTripScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const mapRef = useRef(null);

  const fetchTrip = useCallback(async () => {
    try {
      const res = await tripTrackingAPI.activeTrip();
      setData(res.data);
      setLastUpdate(new Date());
      // Pan map to bus position
      if (res.data?.gps && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: res.data.gps.latitude,
          longitude: res.data.gps.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }, 800);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTrip();
    intervalRef.current = setInterval(fetchTrip, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchTrip]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Recherche du trajet...</Text>
      </View>
    );
  }

  if (!data?.active) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Ionicons name="bus-outline" size={48} color={COLORS.lightGray} />
        </View>
        <Text style={styles.emptyTitle}>Aucun trajet actif</Text>
        <Text style={styles.emptySub}>Payez un trajet pour suivre votre bus en temps réel</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { ligne, bus, chauffeur, trip, gps, stops } = data;
  const lineColor = ligne?.couleur || COLORS.primary;
  const busCoord = gps ? { latitude: gps.latitude, longitude: gps.longitude } : null;
  const routeCoords = stops?.map(s => ({ latitude: s.latitude, longitude: s.longitude })) || [];

  const formatSpeed = (v) => v ? `${Math.round(v)} km/h` : '—';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <View style={styles.container}>
      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={busCoord ? { ...busCoord, latitudeDelta: 0.05, longitudeDelta: 0.05 } : NOUA}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeColor={lineColor} strokeWidth={4} lineDashPattern={[8, 4]} />
        )}
        {stops?.map((s, i) => (
          <Marker key={i} coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.stopDot, { backgroundColor: lineColor }]} />
          </Marker>
        ))}
        {busCoord && (
          <Marker coordinate={busCoord} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.busMarker, { backgroundColor: lineColor }]}>
              <Ionicons name="bus" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ── Top info bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn2}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topBarInfo}>
          <Text style={styles.topBarTitle}>Trajet en cours</Text>
          <Text style={styles.topBarSub}>
            {ligne?.code ? `${ligne.code} — ` : ''}{ligne?.nom || 'Ligne inconnue'}
          </Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: gps ? COLORS.success : COLORS.warning }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTxt}>LIVE</Text>
        </View>
      </View>

      {/* ── Bottom panel ── */}
      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent} showsVerticalScrollIndicator={false}>

        {/* Bus info card */}
        <View style={[styles.card, SHADOW.small]}>
          <View style={[styles.cardLeft, { backgroundColor: lineColor + '15', borderLeftColor: lineColor, borderLeftWidth: 4 }]}>
            <View style={styles.busRow}>
              <View style={[styles.busIcon, { backgroundColor: lineColor }]}>
                <Ionicons name="bus" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.busNum}>Bus {bus?.numero_bus || '—'}</Text>
                <Text style={styles.busCapacity}>{bus?.capacite ? `${bus.capacite} places` : ''}</Text>
              </View>
            </View>
            {chauffeur && (
              <View style={styles.chauffeurRow}>
                <Ionicons name="person-outline" size={14} color={COLORS.gray} />
                <Text style={styles.chauffeurText}>{chauffeur}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Route card */}
        <View style={[styles.card, SHADOW.small]}>
          <Text style={styles.cardTitle}>Itinéraire</Text>
          <View style={styles.routeRow}>
            <View style={styles.routeLeft}>
              <View style={[styles.routeDotBig, { backgroundColor: COLORS.success }]} />
              <View style={[styles.routeLine2, { backgroundColor: lineColor }]} />
              <View style={[styles.routeDotBig, { backgroundColor: COLORS.warning }]} />
            </View>
            <View style={styles.routeRight2}>
              <Text style={styles.terminus}>{ligne?.terminus_depart || 'Départ'}</Text>
              <Text style={styles.arrow}>{stops?.length ? `${stops.length} arrêts` : ''}</Text>
              <Text style={styles.terminus}>{ligne?.terminus_arrivee || 'Destination'}</Text>
            </View>
          </View>
        </View>

        {/* GPS status */}
        <View style={[styles.card, SHADOW.small]}>
          <Text style={styles.cardTitle}>Position GPS</Text>
          <View style={styles.gpsGrid}>
            <GpsItem icon="speedometer-outline" label="Vitesse" value={formatSpeed(gps?.vitesse_kmh)} color={COLORS.primary} />
            <GpsItem icon="location-outline" label="Dernière mise à jour" value={formatTime(gps?.timestamp)} color={COLORS.success} />
            <GpsItem icon="people-outline" label="Passagers" value={trip?.nombre_passagers || 0} color={COLORS.warning} />
            <GpsItem icon="time-outline" label="Départ" value={formatTime(trip?.date_debut)} color={COLORS.accent} />
          </View>
          {lastUpdate && (
            <Text style={styles.updateText}>Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
          )}
        </View>

        {/* Stops list */}
        {stops?.length > 0 && (
          <View style={[styles.card, SHADOW.small]}>
            <Text style={styles.cardTitle}>Arrêts ({stops.length})</Text>
            {stops.map((s, i) => (
              <View key={i} style={styles.stopRow}>
                <View style={[styles.stopNum, { backgroundColor: lineColor }]}>
                  <Text style={styles.stopNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stopName}>{s.nom}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function GpsItem({ icon, label, value, color }) {
  return (
    <View style={styles.gpsItem}>
      <View style={[styles.gpsIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.gpsValue, { color }]}>{value}</Text>
      <Text style={styles.gpsLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.background },
  map: { height: 320 },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backBtn2: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  topBarInfo: { flex: 1 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  topBarSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Panel
  panel: { flex: 1 },
  panelContent: { padding: 16, gap: 12 },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16 },
  cardLeft: { borderRadius: RADIUS.lg, padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },

  // Bus info
  busRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  busIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  busNum: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  busCapacity: { fontSize: 12, color: COLORS.gray },
  chauffeurRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chauffeurText: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },

  // Route
  routeRow: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  routeLeft: { alignItems: 'center', width: 14 },
  routeDotBig: { width: 12, height: 12, borderRadius: 6 },
  routeLine2: { width: 2, flex: 1, marginVertical: 4 },
  routeRight2: { flex: 1, justifyContent: 'space-between', gap: 8 },
  terminus: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  arrow: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic' },

  // GPS grid
  gpsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gpsItem: { width: (width - 72) / 2, alignItems: 'center', gap: 4, paddingVertical: 8 },
  gpsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gpsValue: { fontSize: 16, fontWeight: '800' },
  gpsLabel: { fontSize: 10, color: COLORS.gray, textAlign: 'center' },
  updateText: { fontSize: 10, color: COLORS.lightGray, textAlign: 'right', marginTop: 8 },

  // Stops list
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderColor: COLORS.border },
  stopDot: { width: 10, height: 10, borderRadius: 5 },
  stopNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stopNumText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  stopName: { fontSize: 14, color: COLORS.dark, fontWeight: '500' },

  // Bus marker on map
  busMarker: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' },

  // Empty state
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 24 },
  backBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  loadingText: { fontSize: 14, color: COLORS.gray, marginTop: 12 },
});
