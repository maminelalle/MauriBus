import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Choice'), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.logoWrap}>
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <Ionicons name="bus" size={48} color={COLORS.primary} />
          </View>
        </View>
      </View>

      <Text style={styles.title}>MauriBus</Text>
      <Text style={styles.subtitle}>Suivez vos bus en temps réel</Text>
      <Text style={styles.sub2}>à Nouakchott</Text>

      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -80 },
  circle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -60, left: -60 },

  logoWrap: { marginBottom: 32 },
  logoRing: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 8 },

  title: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: '500' },
  sub2: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  dots: { flexDirection: 'row', gap: 8, marginTop: 48 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#fff', width: 24, borderRadius: 4 },
});
