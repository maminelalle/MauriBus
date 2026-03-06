import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function ChoiceScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.header}>
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <Ionicons name="bus" size={40} color={COLORS.primary} />
          </View>
        </View>
        <Text style={styles.title}>MauriBus</Text>
        <Text style={styles.subtitle}>Bienvenue ! Comment souhaitez-vous continuer ?</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity style={[styles.card, SHADOW.medium]} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
          <View style={[styles.cardIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="log-in-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.cardTitle}>Se connecter</Text>
          <Text style={styles.cardSub}>J'ai déjà un compte</Text>
          <View style={[styles.cardArrow, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, SHADOW.medium]} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
          <View style={[styles.cardIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="person-add-outline" size={32} color={COLORS.success} />
          </View>
          <Text style={styles.cardTitle}>Créer un compte</Text>
          <Text style={styles.cardSub}>Nouveau sur MauriBus</Text>
          <View style={[styles.cardArrow, { backgroundColor: COLORS.success }]}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Transport public de Nouakchott</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 24 },
  circle1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  circle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -40 },

  header: { alignItems: 'center', gap: 12 },
  logoRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', paddingHorizontal: 20 },

  cards: { gap: 16, width: '100%' },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.xxl, padding: 24,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  cardIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cardSub: { position: 'absolute', left: 100, top: 38, fontSize: 12, color: '#94A3B8' },
  cardArrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  footer: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});
