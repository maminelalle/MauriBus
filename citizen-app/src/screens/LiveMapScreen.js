import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { busesAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const NOUA = { latitude: 18.0735, longitude: -15.9582, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export default function LiveMapScreen({ navigation }) {
  const [buses, setBuses] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    requestLocation();
    fetchBuses();
    intervalRef.current = setInterval(fetchBuses, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch {}
  };

  const fetchBuses = async () => {
    try {
      const res = await busesAPI.live();
      const data = Array.isArray(res.data) ? res.data : [];
      setBuses(data.filter(b => b.gps));
      setLastUpdate(new Date());
    } catch {}
    finally { setLoading(false); }
  };

  const centerOnUser = () => {
    if (userPos && mapRef.current) {
      mapRef.current.animateToRegion({ ...userPos, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600);
    }
  };

  const centerOnCity = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(NOUA, 600);
    }
  };

  const formatTime = (date) => {
    if (!date) return '—';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={userPos ? { ...userPos, latitudeDelta: 0.1, longitudeDelta: 0.1 } : NOUA}
        >
          {buses.map(b => (
            <Marker
              key={b.id}
              coordinate={{ latitude: b.gps.latitude, longitude: b.gps.longitude }}
              title={`Bus ${b.numero_bus}`}
              description={b.lignes?.[0]?.nom || ''}
            >
              <View style={styles.busMarker}>
                <Ionicons name="bus" size={18} color={b.lignes?.[0]?.couleur || COLORS.primary} />
              </View>
            </Marker>
          ))}
          {userPos && (
            <Marker coordinate={userPos} title="Ma position">
              <View style={styles.userMarker}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Top overlay */}
      <View style={styles.topOverlay}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titleCard}>
          <Ionicons name="radio-button-on" size={12} color={COLORS.success} />
          <Text style={styles.titleText}>{buses.length} bus en direct</Text>
        </View>
      </View>

      {/* Last update */}
      <View style={styles.updateBar}>
        <Ionicons name="refresh-outline" size={13} color={COLORS.gray} />
        <Text style={styles.updateText}>Mis à jour : {formatTime(lastUpdate)}</Text>
        <TouchableOpacity onPress={fetchBuses} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>Actualiser</Text>
        </TouchableOpacity>
      </View>

      {/* Map controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrlBtn, SHADOW.small]} onPress={centerOnUser}>
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, SHADOW.small]} onPress={centerOnCity}>
          <Ionicons name="map-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, SHADOW.small]} onPress={fetchBuses}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={[styles.legend, SHADOW.small]}>
        <View style={styles.legendItem}>
          <View style={styles.busMarkerSmall}><Ionicons name="bus" size={12} color={COLORS.primary} /></View>
          <Text style={styles.legendText}>Bus actif</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.userMarker}><View style={styles.userMarkerInner} /></View>
          <Text style={styles.legendText}>Ma position</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },

  busMarker: { backgroundColor: '#fff', borderRadius: 14, padding: 5, borderWidth: 2, borderColor: COLORS.primary },
  busMarkerSmall: { backgroundColor: '#fff', borderRadius: 10, padding: 3, borderWidth: 1.5, borderColor: COLORS.primary },
  userMarker: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(5,150,105,0.25)', alignItems: 'center', justifyContent: 'center' },
  userMarkerInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  topOverlay: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  titleCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  titleText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  updateBar: { position: 'absolute', bottom: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } },
  updateText: { fontSize: 12, color: COLORS.gray },
  refreshBtn: {},
  refreshBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  controls: { position: 'absolute', right: 16, bottom: 140, gap: 10 },
  ctrlBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  legend: { position: 'absolute', bottom: 30, left: 16, backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 12, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { fontSize: 12, color: '#0F172A', fontWeight: '500' },
});
