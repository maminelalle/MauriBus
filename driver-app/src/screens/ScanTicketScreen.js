import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Animated, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ticketValidationAPI } from '../utils/api';
import { COLORS, RADIUS } from '../utils/theme';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.70;

export default function ScanTicketScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);  // { valid, detail, citoyen, montant, ligne }
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleScan = async ({ data }) => {
    if (!scanning || loading || !data) return;
    setScanning(false);
    setLoading(true);
    try {
      const res = await ticketValidationAPI.validate(data);
      setResult(res.data);
    } catch (e) {
      const errData = e?.response?.data || {};
      setResult({ valid: false, detail: errData.detail || 'Ticket invalide' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setScanning(true);
  };

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={COLORS.lightGray} />
        <Text style={styles.permText}>Accès à la caméra requis</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.container}>
        <View style={[styles.resultCard, { backgroundColor: result.valid ? COLORS.success : COLORS.danger }]}>
          <Ionicons
            name={result.valid ? 'checkmark-circle' : 'close-circle'}
            size={80}
            color="#fff"
          />
          <Text style={styles.resultTitle}>{result.valid ? 'Ticket valide !' : 'Ticket invalide'}</Text>
          <Text style={styles.resultDetail}>{result.detail}</Text>
        </View>

        {result.valid && (
          <View style={styles.resultInfo}>
            <InfoRow icon="person-outline" label="Passager" value={result.citoyen || '—'} />
            <InfoRow icon="cash-outline" label="Montant payé" value={result.montant ? `${parseFloat(result.montant).toFixed(0)} MRU` : '—'} />
            <InfoRow icon="map-outline" label="Ligne" value={result.ligne || '—'} />
            <InfoRow icon="wallet-outline" label="Méthode" value={result.methode || '—'} />
          </View>
        )}

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.scanAgainBtn} onPress={reset} activeOpacity={0.85}>
            <Ionicons name="qr-code-outline" size={20} color="#fff" />
            <Text style={styles.scanAgainText}>Scanner un autre ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.closeBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanning ? handleScan : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scanner un ticket</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Scan frame */}
        <View style={styles.scanArea}>
          <Animated.View style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </Animated.View>
          <Text style={styles.scanHint}>
            {loading ? 'Validation en cours...' : 'Pointez la caméra sur le QR code'}
          </Text>
          {loading && <ActivityIndicator color="#fff" size="large" style={{ marginTop: 16 }} />}
        </View>
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={COLORS.gray} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 32 },

  overlay: { flex: 1, backgroundColor: 'transparent' },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },

  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: SCAN_SIZE, height: SCAN_SIZE,
    borderRadius: RADIUS.xl, position: 'relative',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#fff', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: RADIUS.md },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: RADIUS.md },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: RADIUS.md },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: RADIUS.md },

  scanHint: { marginTop: SCAN_SIZE / 2 + 20, color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },

  // Result
  resultCard: { padding: 32, alignItems: 'center' },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 12 },
  resultDetail: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },

  resultInfo: { flex: 1, backgroundColor: '#fff', padding: 20, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, fontSize: 13, color: COLORS.gray },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  resultActions: { backgroundColor: '#fff', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  scanAgainBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: RADIUS.xl },
  scanAgainText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  closeBtn: { backgroundColor: COLORS.background, paddingVertical: 12, borderRadius: RADIUS.xl, alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.gray },

  permText: { fontSize: 16, color: COLORS.dark, fontWeight: '600', marginTop: 16, marginBottom: 24 },
  permBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.lg },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
