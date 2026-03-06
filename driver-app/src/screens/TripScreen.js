import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Dimensions, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { tripAPI, gpsAPI, reportAPI, stopAPI } from '../utils/api';
import { COLORS, RADIUS } from '../utils/theme';

const { height } = Dimensions.get('window');
const NOUA = { latitude: 18.0735, longitude: -15.9582 };

export default function TripScreen({ route, navigation }) {
  const { driver } = useAuth();
  const { trip: initialTrip } = route.params;
  const [trip] = useState(initialTrip);
  const [position, setPosition] = useState(null);
  const [trail, setTrail] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);
  const [stops, setStops] = useState([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [advancingStop, setAdvancingStop] = useState(false);

  const mapRef = useRef(null);
  const locationSub = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startTracking();
    startTimer();
    loadStops();
    return () => {
      locationSub.current?.remove();
      clearInterval(timerRef.current);
    };
  }, []);

  const loadStops = async () => {
    try {
      const res = await stopAPI.getStops(trip.id);
      setStops(res.data.stops || []);
      setCurrentStopIndex(res.data.current_index || 0);
    } catch {}
  };

  const handleNextStop = async () => {
    if (advancingStop || currentStopIndex >= stops.length - 1) return;
    setAdvancingStop(true);
    try {
      const res = await stopAPI.nextStop(trip.id);
      setCurrentStopIndex(res.data.current_index);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'avancer à l\'arrêt suivant.');
    } finally {
      setAdvancingStop(false);
    }
  };

  const startTimer = () => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'La localisation est nécessaire pour suivre le trajet.');
      return;
    }
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 10 },
      (loc) => {
        const { latitude, longitude, speed: spd } = loc.coords;
        const pt = { latitude, longitude };
        setPosition(pt);
        setSpeed(Math.round((spd || 0) * 3.6));
        setTrail((prev) => [...prev.slice(-300), pt]);
        mapRef.current?.animateToRegion({ ...pt, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 600);
        gpsAPI.post({
          bus_id: driver.bus?.id,
          trajet_id: trip.id,
          latitude,
          longitude,
          vitesse_kmh: Math.round((spd || 0) * 3.6),
        }).catch(() => {});
      }
    );
  };

  const stopTracking = () => {
    locationSub.current?.remove();
    locationSub.current = null;
  };

  const togglePause = () => {
    if (paused) {
      startTracking();
      setPaused(false);
    } else {
      stopTracking();
      setPaused(true);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 SOS — Urgence',
      'Choisissez le type d\'incident',
      [
        { text: '🚗 Accident', onPress: () => sendEmergency('ACCIDENT') },
        { text: '🔧 Panne mécanique', onPress: () => sendEmergency('PANNE_MECANIQUE') },
        { text: '🚧 Incident route', onPress: () => sendEmergency('INCIDENT_ROUTE') },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const sendEmergency = async (type) => {
    try {
      await reportAPI.create({
        bus_id: driver.bus?.id,
        type_signalement: type,
        titre: `${type} - ${driver.prenom} ${driver.nom}`,
        description: `Signalement urgent de ${driver.prenom} ${driver.nom} (${driver.matricule})`,
        priorite: 'CRITIQUE',
      });
      Alert.alert('✅ Signalement envoyé', 'L\'administration a été notifiée. Restez en sécurité.');
    } catch {
      Alert.alert('Erreur', 'Signalement non envoyé, réessayez.');
    }
  };

  const handleSendAlert = async () => {
    if (!alertText.trim()) return;
    setSendingAlert(true);
    try {
      await reportAPI.create({
        bus_id: driver.bus?.id,
        type_signalement: 'AUTRE',
        titre: `Message trajet - ${driver.matricule}`,
        description: alertText.trim(),
        priorite: 'NORMALE',
      });
      setAlertText('');
      Alert.alert('Envoyé', 'Votre message a bien été transmis à l\'administration.');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    } finally {
      setSendingAlert(false);
    }
  };

  const handleEndTrip = () => {
    Alert.alert(
      'Terminer le trajet ?',
      `Durée : ${formatTime(elapsed)}\n${trail.length} points GPS enregistrés`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            setEnding(true);
            stopTracking();
            clearInterval(timerRef.current);
            try {
              await tripAPI.update(trip.id, {
                statut: 'COMPLETEE',
                distance_reelle_km: Math.round(trail.length * 0.04 * 10) / 10,
              });
              navigation.replace('Main');
            } catch {
              Alert.alert('Erreur', 'Impossible de terminer le trajet. Réessayez.');
              setEnding(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}h ${m.toString().padStart(2, '0')}m`
      : `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const line = driver.bus?.lignes?.[0];
  const lineColor = line?.couleur || COLORS.primary;
  const mapCenter = position || NOUA;

  return (
    <View style={styles.container}>
      {/* ── Full screen map ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ ...mapCenter, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {trail.length > 1 && (
          <Polyline coordinates={trail} strokeColor={COLORS.primary} strokeWidth={5} lineDashPattern={undefined} />
        )}
        {position && (
          <Marker coordinate={position} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.busMarker, { backgroundColor: lineColor }]}>
              <Ionicons name="bus" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ── Top HUD ── */}
      <View style={styles.topHud}>
        <HudItem icon="speedometer-outline" value={`${speed}`} unit="km/h" color={COLORS.primary} />
        <View style={styles.hudDivider} />
        <HudItem icon="time-outline" value={formatTime(elapsed)} unit={paused ? 'PAUSE' : ''} color={COLORS.warning} />
        <View style={styles.hudDivider} />
        <HudItem icon="navigate-circle-outline" value={`${trail.length}`} unit="pts GPS" color={COLORS.success} />
      </View>

      {/* ── Line bar ── */}
      {line && (
        <View style={[styles.lineBar, { backgroundColor: lineColor }]}>
          <Ionicons name="git-branch-outline" size={14} color="#fff" />
          <Text style={styles.lineBarText}>{line.code} — {line.nom}</Text>
          <Text style={styles.busNumText}>Bus {driver.bus?.numero_bus}</Text>
        </View>
      )}

      {/* ── Bottom action panel ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomPanel}
      >
        {/* Status row */}
        <View style={styles.panelHeader}>
          <View style={[styles.routeBadge, { backgroundColor: paused ? COLORS.warning + '20' : COLORS.success + '20' }]}>
            <View style={[styles.routeDot, { backgroundColor: paused ? COLORS.warning : COLORS.success }]} />
            <Text style={[styles.routeStatus, { color: paused ? COLORS.warning : COLORS.success }]}>
              {paused ? 'En pause' : 'En route'}
            </Text>
          </View>
          <Text style={styles.panelBusInfo}>Bus {driver.bus?.numero_bus} · {driver.prenom} {driver.nom}</Text>
        </View>

        {line && (
          <Text style={styles.panelLineName}>{line.code} — {line.nom}</Text>
        )}

        {/* Stop progression bar */}
        {stops.length > 0 && (
          <View style={styles.stopBar}>
            <View style={styles.stopBarHeader}>
              <Ionicons name="navigate-circle-outline" size={14} color={COLORS.primary} />
              <Text style={styles.stopBarLabel}>
                Arrêt {currentStopIndex + 1}/{stops.length} — <Text style={styles.stopBarName}>{stops[currentStopIndex]?.nom || '—'}</Text>
              </Text>
              {currentStopIndex < stops.length - 1 && (
                <Text style={styles.stopBarNext}>→ {stops[currentStopIndex + 1]?.nom}</Text>
              )}
            </View>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((currentStopIndex) / Math.max(stops.length - 1, 1)) * 100}%` }]} />
            </View>
            <View style={styles.stopActions}>
              <TouchableOpacity
                style={[styles.nextStopBtn, (currentStopIndex >= stops.length - 1 || advancingStop) && styles.nextStopBtnDim]}
                onPress={handleNextStop}
                disabled={currentStopIndex >= stops.length - 1 || advancingStop}
                activeOpacity={0.8}
              >
                {advancingStop
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="arrow-forward-circle" size={16} color="#fff" />
                      <Text style={styles.nextStopBtnText}>
                        {currentStopIndex >= stops.length - 1 ? 'Terminus atteint' : 'Arrêt suivant'}
                      </Text>
                    </>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => navigation.navigate('ScanTicket')}
                activeOpacity={0.85}
              >
                <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
                <Text style={styles.scanBtnText}>Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scan ticket button when no stops */}
        {stops.length === 0 && (
          <TouchableOpacity
            style={styles.scanTicketRow}
            onPress={() => navigation.navigate('ScanTicket')}
            activeOpacity={0.85}
          >
            <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} />
            <Text style={styles.scanTicketRowText}>Scanner un ticket citoyen</Text>
          </TouchableOpacity>
        )}

        {/* 3 action buttons */}
        <View style={styles.actionRow}>
          <ActionBtn
            icon={paused ? 'play' : 'pause'}
            label={paused ? 'Reprendre' : 'Pause'}
            color={COLORS.warning}
            onPress={togglePause}
          />
          <TouchableOpacity style={styles.sosBtn} onPress={handleSOS} activeOpacity={0.85}>
            <Ionicons name="alert-circle" size={26} color="#fff" />
            <Text style={styles.sosBtnText}>SOS</Text>
          </TouchableOpacity>
          <ActionBtn
            icon="stop-circle"
            label="Terminer"
            color={COLORS.danger}
            onPress={handleEndTrip}
            loading={ending}
          />
        </View>

        {/* Description / alert field */}
        <View style={styles.alertSection}>
          <Text style={styles.alertLabel}>Description du problème</Text>
          <View style={styles.alertInputWrap}>
            <TextInput
              style={styles.alertInput}
              value={alertText}
              onChangeText={setAlertText}
              placeholder="Décrivez un incident ou envoyez un message..."
              placeholderTextColor={COLORS.lightGray}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendAlertBtn, (!alertText.trim() || sendingAlert) && styles.sendAlertBtnDim]}
            onPress={handleSendAlert}
            disabled={!alertText.trim() || sendingAlert}
          >
            {sendingAlert ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.sendAlertBtnText}>Envoyer Alerte</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function HudItem({ icon, value, unit, color }) {
  return (
    <View style={styles.hudItem}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.hudValue, { color }]}>{value}</Text>
      {unit ? <Text style={styles.hudUnit}>{unit}</Text> : null}
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress, loading }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: color }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Ionicons name={icon} size={20} color="#fff" />
          <Text style={styles.actionBtnText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Top HUD
  topHud: {
    position: 'absolute', top: 50, left: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: RADIUS.xl,
    padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
  },
  hudItem: { flex: 1, alignItems: 'center', gap: 2 },
  hudDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0' },
  hudValue: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  hudUnit: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },

  // Line bar
  lineBar: {
    position: 'absolute', top: 120, left: 16, right: 16,
    borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  lineBarText: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 13 },
  busNumText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },

  // Bus marker
  busMarker: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },

  // Bottom panel
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  routeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  routeDot: { width: 6, height: 6, borderRadius: 3 },
  routeStatus: { fontSize: 12, fontWeight: '700' },
  panelBusInfo: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  panelLineName: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 14 },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 },
  actionBtn: {
    flex: 1, borderRadius: RADIUS.lg, paddingVertical: 14,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  sosBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  sosBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', marginTop: 2 },

  // Stop progression
  stopBar: { backgroundColor: COLORS.primary + '08', borderRadius: RADIUS.lg, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.primary + '20' },
  stopBarHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  stopBarLabel: { fontSize: 12, fontWeight: '600', color: COLORS.dark, flex: 1 },
  stopBarName: { color: COLORS.primary, fontWeight: '700' },
  stopBarNext: { fontSize: 10, color: COLORS.gray, fontStyle: 'italic' },
  progressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  stopActions: { flexDirection: 'row', gap: 8 },
  nextStopBtn: { flex: 1, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: RADIUS.md },
  nextStopBtnDim: { opacity: 0.5 },
  nextStopBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  scanBtn: { backgroundColor: COLORS.primary + '15', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
  scanBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  scanTicketRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.md, padding: 10, marginBottom: 10 },
  scanTicketRowText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  // Alert section
  alertSection: {},
  alertLabel: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  alertInputWrap: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    backgroundColor: COLORS.background, marginBottom: 10,
  },
  alertInput: {
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.dark, minHeight: 60,
  },
  sendAlertBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  sendAlertBtnDim: { opacity: 0.45 },
  sendAlertBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
