import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { citizenAuth } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ nom: '', prenom: '', nni: '', email: '', telephone: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.nom || !form.prenom || !form.telephone || !form.password) {
      Alert.alert('Champs requis', 'Nom, prénom, téléphone et mot de passe sont obligatoires.');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await citizenAuth.register({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        nni: form.nni.trim() || undefined,
        email: form.email.trim() || undefined,
        telephone: form.telephone.trim(),
        password: form.password,
      });
      Alert.alert('Compte créé !', 'Votre compte a été créé avec succès. Connectez-vous maintenant.', [
        { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.detail || 'Impossible de créer le compte.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon, label, field, placeholder, keyboard, secure }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={18} color={COLORS.lightGray} />
        <TextInput style={[styles.input, { flex: 1 }]} value={form[field]} onChangeText={v => set(field, v)}
          placeholder={placeholder} placeholderTextColor={COLORS.lightGray}
          keyboardType={keyboard || 'default'} secureTextEntry={secure && !showPwd} />
        {secure && (
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
            <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.lightGray} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topSection}>
          <View style={styles.circleA} /><View style={styles.circleB} />
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="person-add" size={36} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.brandName}>Créer un compte</Text>
          <Text style={styles.brandSub}>Rejoignez MauriBus dès maintenant</Text>
        </View>

        <View style={styles.card}>
          <Field icon="person-outline" label="Prénom *" field="prenom" placeholder="Ex: Mohamed" />
          <Field icon="person-outline" label="Nom *" field="nom" placeholder="Ex: Ould Ahmed" />
          <Field icon="call-outline" label="Téléphone *" field="telephone" placeholder="Ex: 22123456" keyboard="phone-pad" />
          <Field icon="card-outline" label="NNI" field="nni" placeholder="Numéro National d'Identité" />
          <Field icon="mail-outline" label="Email" field="email" placeholder="exemple@email.com" keyboard="email-address" />
          <Field icon="lock-closed-outline" label="Mot de passe *" field="password" placeholder="Min. 6 caractères" secure />
          <Field icon="lock-closed-outline" label="Confirmer mot de passe *" field="confirm" placeholder="Répétez le mot de passe" secure />

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.btnText}>Créer mon compte</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Déjà un compte ? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Se connecter</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  topSection: { alignItems: 'center', paddingVertical: 40, overflow: 'hidden' },
  circleA: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -50 },
  circleB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -40 },
  logoRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 26, fontWeight: '800', color: '#fff' },
  brandSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, minHeight: 500 },
  label: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.background, paddingHorizontal: 14, height: 50, marginBottom: 14 },
  input: { fontSize: 15, color: '#0F172A' },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, marginBottom: 16 },
  btnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: COLORS.gray },
});
