import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const NOUA = { latitude: 18.0735, longitude: -15.9582, latitudeDelta: 0.15, longitudeDelta: 0.15 };

function computeRegion(coords) {
  if (!coords || coords.length === 0) return NOUA;
  const lats = coords.map(c => c.latitude);
  const lons = coords.map(c => c.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const pad = 0.025;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad, 0.05),
    longitudeDelta: Math.max(maxLon - minLon + pad, 0.05),
  };
}

export default function LineDetailScreen({ route, navigation }) {
  const { line } = route.params;
  const color = line.couleur || COLORS.primary;

  const stops = (line.stops || [])
    .filter(s => s.latitude && s.longitude)
    .map(s => ({ ...s, latitude: parseFloat(s.latitude), longitude: parseFloat(s.longitude) }));

  const polyCoords = stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }));
  const mapRegion = computeRegion(polyCoords);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{line.code}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{line.nom}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{line.terminus_depart} vers {line.terminus_arrivee}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map with polyline route */}
        <View style={styles.mapWrap}>
          <MapView style={styles.map} initialRegion={mapRegion}>
            {/* Route polyline */}
            {polyCoords.length >= 2 && (
              <Polyline coordinates={polyCoords} strokeColor={color} strokeWidth={4} />
            )}
            {/* Stop markers */}
            {stops.map((s, i) => (
              <Marker
                key={i}
                coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                title={s.nom}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[
                  styles.stopMarker, { borderColor: color },
                  (i === 0 || i === stops.length - 1) && { backgroundColor: color, width: 20, height: 20, borderRadius: 10 }
                ]}>
                  {(i === 0 || i === stops.length - 1)
                    ? <Ionicons name={i === 0 ? 'location' : 'flag'} size={11} color="#fff" />
                    : <View style={[styles.stopDotInner, { backgroundColor: color }]} />
                  }
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Legend */}
          {polyCoords.length >= 2 && (
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: color }]} />
                <Text style={styles.legendText}>Trajet</Text>
              </View>
            </View>
          )}
          {polyCoords.length === 0 && (
            <View style={styles.noGps}>
              <Ionicons name="map-outline" size={18} color={COLORS.gray} />
              <Text style={styles.noGpsText}>GPS non disponible</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCard, SHADOW.small]}>
            <Ionicons name="cash-outline" size={20} color={color} />
            <Text style={styles.infoVal}>{parseFloat(line.tarif_base || 0).toFixed(0)} MRU</Text>
            <Text style={styles.infoLabel}>Tarif</Text>
          </View>
          <View style={[styles.infoCard, SHADOW.small]}>
            <Ionicons name="time-outline" size={20} color={color} />
            <Text style={styles.infoVal}>{line.frequence_minutes || '--'} min</Text>
            <Text style={styles.infoLabel}>Frequence</Text>
          </View>
          <View style={[styles.infoCard, SHADOW.small]}>
            <Ionicons name="location-outline" size={20} color={color} />
            <Text style={styles.infoVal}>{line.stops?.length || 0}</Text>
            <Text style={styles.infoLabel}>Arrets</Text>
          </View>
        </View>

        {/* Route summary */}
        <View style={styles.routeCard}>
          <View style={styles.routeEndpoint}>
            <View style={[styles.routeDot, { backgroundColor: color }]} />
            <View>
              <Text style={styles.routeEndLabel}>Depart</Text>
              <Text style={styles.routeEndName}>{line.terminus_depart}</Text>
            </View>
          </View>
          <View style={{ paddingLeft: 19, paddingVertical: 4 }}>
            <Ionicons name="arrow-down" size={14} color={color} />
          </View>
          <View style={styles.routeEndpoint}>
            <View style={[styles.routeDot, { backgroundColor: color, borderRadius: 3 }]} />
            <View>
              <Text style={styles.routeEndLabel}>Arrivee</Text>
              <Text style={styles.routeEndName}>{line.terminus_arrivee}</Text>
            </View>
          </View>
        </View>

        {/* Stops list */}
        {stops.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={18} color={COLORS.dark} />
              <Text style={styles.sectionTitle}>Arrets ({stops.length})</Text>
            </View>
            {stops.map((s, i) => (
              <View key={i} style={styles.stopRow}>
                <View style={styles.stopTimeline}>
                  <View style={[styles.stopCircle, { borderColor: color }, (i === 0 || i === stops.length - 1) && { backgroundColor: color }]} />
                  {i < stops.length - 1 && <View style={[styles.stopConnector, { backgroundColor: color + '50' }]} />}
                </View>
                <View style={styles.stopInfoBox}>
                  <Text style={[styles.stopName, (i === 0 || i === stops.length - 1) && { color, fontWeight: '700' }]}>{s.nom}</Text>
                  {s.description ? <Text style={styles.stopDesc}>{s.description}</Text> : null}
                </View>
                {i === 0 && <View style={[styles.badge, { backgroundColor: color + '20' }]}><Text style={[styles.badgeText, { color }]}>Dep</Text></View>}
                {i === stops.length - 1 && <View style={[styles.badge, { backgroundColor: color + '20' }]}><Text style={[styles.badgeText, { color }]}>Arr</Text></View>}
              </View>
            ))}
          </View>
        )}

        {/* Pay button */}
        <View style={styles.payWrap}>
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: color }]}
            onPress={() => navigation.navigate('Payment', { line })}
            activeOpacity={0.85}
          >
            <Ionicons name="wallet-outline" size={20} color="#fff" />
            <Text style={styles.payBtnText}>Payer ce trajet - {parseFloat(line.tarif_base || 0).toFixed(0)} MRU</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeBadge: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  codeText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  mapWrap: { height: 250, position: 'relative' },
  map: { flex: 1 },
  stopMarker: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  stopDotInner: { width: 5, height: 5, borderRadius: 3 },
  mapLegend: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 20, height: 3, borderRadius: 2 },
  legendText: { fontSize: 11, color: '#0F172A', fontWeight: '500' },
  noGps: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  noGpsText: { fontSize: 12, color: COLORS.gray },
  infoRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 16 },
  infoCard: { flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', gap: 6 },
  infoVal: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  infoLabel: { fontSize: 11, color: COLORS.gray },
  routeCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: RADIUS.xl, padding: 16, elevation: 2 },
  routeEndpoint: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeDot: { width: 14, height: 14, borderRadius: 7 },
  routeEndLabel: { fontSize: 11, color: COLORS.gray },
  routeEndName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  stopRow: { flexDirection: 'row', gap: 12, minHeight: 48 },
  stopTimeline: { width: 20, alignItems: 'center', paddingTop: 4 },
  stopCircle: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, backgroundColor: '#fff' },
  stopConnector: { width: 2, flex: 1, marginTop: 2, marginBottom: -2 },
  stopInfoBox: { flex: 1, paddingBottom: 12 },
  stopName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  stopDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  payWrap: { paddingHorizontal: 16, marginTop: 24 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: RADIUS.xl },
  payBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
