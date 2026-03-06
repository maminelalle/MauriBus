import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!telephone.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre téléphone et mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(telephone.trim(), password);
    } catch (err) {
      Alert.alert('Connexion échouée', err.response?.data?.detail || 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <View style={styles.topSection}>
        <View style={styles.circleA} /><View style={styles.circleB} />
        <View style={styles.brand}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="bus" size={38} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.brandName}>MauriBus</Text>
          <Text style={styles.brandTagline}>Espace Citoyen</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.cardWrapper}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSub}>Bienvenue ! Connectez-vous pour continuer.</Text>

            <Text style={styles.label}>Numéro de téléphone</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={20} color={COLORS.lightGray} />
              <TextInput style={styles.input} value={telephone} onChangeText={setTelephone}
                placeholder="Ex: 22123456" placeholderTextColor={COLORS.lightGray}
                keyboardType="phone-pad" returnKeyType="next" />
            </View>

            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} />
              <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword}
                placeholder="••••••••" placeholderTextColor={COLORS.lightGray}
                secureTextEntry={!showPwd} returnKeyType="done" onSubmitEditing={handleLogin} />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.lightGray} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Ionicons name="log-in-outline" size={22} color="#fff" />
                  <Text style={styles.loginBtnText}>Se connecter</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Pas encore de compte ? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Créer un compte</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  topSection: { height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  circleA: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -60 },
  circleB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: -40 },
  brand: { alignItems: 'center' },
  logoRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  brandTagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  cardWrapper: { flex: 1, paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.xxl, padding: 24, ...SHADOW.large },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  cardSub: { fontSize: 14, color: COLORS.gray, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.background, paddingHorizontal: 14, height: 54, marginBottom: 16 },
  input: { flex: 1, fontSize: 16, color: '#0F172A' },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4, marginBottom: 16 },
  loginBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  registerLink: { alignItems: 'center', paddingVertical: 8 },
  registerText: { fontSize: 14, color: COLORS.gray },
});
