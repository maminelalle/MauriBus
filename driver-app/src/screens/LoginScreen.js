import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!matricule.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre matricule et mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(matricule.trim().toUpperCase(), password);
    } catch (err) {
      Alert.alert('Connexion échouée', err.response?.data?.detail || 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ── Top blue section ── */}
      <View style={styles.topSection}>
        <View style={[styles.circle, styles.circleA]} />
        <View style={[styles.circle, styles.circleB]} />

        <View style={styles.brand}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="bus" size={40} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.brandName}>MauriBus</Text>
          <Text style={styles.brandTagline}>Espace Chauffeur</Text>
        </View>

        <View style={styles.busRow}>
          <Ionicons name="bus-outline" size={22} color="rgba(255,255,255,0.2)" />
          <Ionicons name="bus-outline" size={36} color="rgba(255,255,255,0.15)" />
          <Ionicons name="bus-outline" size={26} color="rgba(255,255,255,0.2)" />
          <Ionicons name="bus-outline" size={18} color="rgba(255,255,255,0.15)" />
        </View>
      </View>

      {/* ── White card ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardWrapper}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSub}>Bienvenue ! Connectez-vous pour continuer.</Text>

          <Text style={styles.label}>Matricule</Text>
          <View style={styles.inputRow}>
            <Ionicons name="card-outline" size={20} color={COLORS.lightGray} />
            <TextInput
              style={styles.input}
              value={matricule}
              onChangeText={setMatricule}
              placeholder="DRV-0001"
              placeholderTextColor={COLORS.lightGray}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.lightGray}
              secureTextEntry={!showPwd}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={22} color="#fff" />
                <Text style={styles.loginBtnText}>Se connecter</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.supportRow}>
            <View style={styles.supportIcon}>
              <Ionicons name="call" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.supportText}>Support : +222 XX XX XX XX</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },

  topSection: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)' },
  circleA: { width: 220, height: 220, top: -70, right: -70 },
  circleB: { width: 160, height: 160, bottom: -50, left: -50 },

  brand: { alignItems: 'center' },
  logoRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoInner: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  brandName: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  brandTagline: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 4 },
  busRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-end', marginTop: 30 },

  cardWrapper: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 24 },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.xxl, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  cardSub: { fontSize: 14, color: COLORS.gray, marginBottom: 24 },

  label: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, backgroundColor: COLORS.background,
    paddingHorizontal: 14, height: 54, marginBottom: 16,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.dark },

  loginBtn: {
    backgroundColor: COLORS.success, borderRadius: RADIUS.lg, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 4, marginBottom: 20,
    shadowColor: COLORS.success, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  loginBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  supportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  supportIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  supportText: { fontSize: 12, color: COLORS.gray },
});
