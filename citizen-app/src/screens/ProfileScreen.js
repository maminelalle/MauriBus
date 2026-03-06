import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../utils/api';

import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const { citizen, logout, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    nom: citizen?.nom || '',
    prenom: citizen?.prenom || '',
    email: citizen?.email || '',
  });

  useFocusEffect(useCallback(() => {
    setForm({ nom: citizen?.nom || '', prenom: citizen?.prenom || '', email: citizen?.email || '' });
  }, [citizen]));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile?.();
    setRefreshing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.update(form);
      await refreshProfile?.();
      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour.');
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.detail || 'Impossible de mettre à jour.');
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: logout },
      ]
    );
  };

  const initials = `${citizen?.prenom?.[0] || ''}${citizen?.nom?.[0] || ''}`.toUpperCase();

  const QUICK_ACTIONS = [
    { icon: 'time-outline', label: 'Historique', color: COLORS.warning, onPress: () => navigation.navigate('History') },
    { icon: 'notifications-outline', label: 'Notifications', color: COLORS.primary, onPress: () => navigation.navigate('Notifications') },
    { icon: 'help-circle-outline', label: 'Support', color: COLORS.success, onPress: () => navigation.navigate('Support') },
    { icon: 'settings-outline', label: 'Paramètres', color: COLORS.gray, onPress: () => navigation.navigate('Settings') },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <Text style={styles.heroName}>{citizen?.prenom} {citizen?.nom}</Text>
        <Text style={styles.heroPhone}>{citizen?.telephone}</Text>
        <View style={styles.heroBadge}>
          <Ionicons name="shield-checkmark" size={13} color={COLORS.success} />
          <Text style={styles.heroBadgeText}>Compte vérifié</Text>
        </View>
      </View>

      {/* Wallet summary */}
      <View style={[styles.walletCard, SHADOW.medium]}>
        <Ionicons name="wallet" size={24} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.walletLabel}>Solde Wallet</Text>
          <Text style={styles.walletAmt}>{parseFloat(citizen?.wallet_balance || 0).toLocaleString('fr-FR')} MRU</Text>
        </View>
        <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.walletBtnText}>Gérer</Text>
        </TouchableOpacity>
      </View>

      {/* Quick actions */}
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map(a => (
          <TouchableOpacity key={a.label} style={[styles.quickBtn, SHADOW.small]} onPress={a.onPress} activeOpacity={0.8}>
            <View style={[styles.quickIcon, { backgroundColor: a.color + '15' }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <TouchableOpacity onPress={() => { if (editing) handleSave(); else setEditing(true); }}>
            <Text style={styles.editBtn}>{editing ? 'Enregistrer' : 'Modifier'}</Text>
          </TouchableOpacity>
        </View>

        {saving && <ActivityIndicator color={COLORS.primary} style={{ marginBottom: 10 }} />}

        <View style={[styles.infoCard, SHADOW.small]}>
          {[
            { label: 'Prénom', key: 'prenom', icon: 'person-outline' },
            { label: 'Nom', key: 'nom', icon: 'person-outline' },
            { label: 'Email', key: 'email', icon: 'mail-outline' },
          ].map((f, i, arr) => (
            <View key={f.key} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
              <Ionicons name={f.icon} size={16} color={COLORS.gray} style={{ width: 20 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{f.label}</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={form[f.key]}
                    onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                    placeholderTextColor={COLORS.gray}
                  />
                ) : (
                  <Text style={styles.infoVal}>{citizen?.[f.key] || '—'}</Text>
                )}
              </View>
            </View>
          ))}

          {/* Read-only fields */}
          {[
            { label: 'Téléphone', value: citizen?.telephone, icon: 'call-outline' },
            { label: 'NNI', value: citizen?.nni, icon: 'card-outline' },
          ].map(f => (
            <View key={f.label} style={[styles.infoRow, styles.infoRowBorder]}>
              <Ionicons name={f.icon} size={16} color={COLORS.gray} style={{ width: 20 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{f.label}</Text>
                <Text style={styles.infoVal}>{f.value || '—'}</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.border} />
            </View>
          ))}
        </View>

        {editing && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setForm({ nom: citizen?.nom || '', prenom: citizen?.prenom || '', email: citizen?.email || '' }); }}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, SHADOW.small]} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  hero: { backgroundColor: COLORS.primary, alignItems: 'center', paddingTop: 32, paddingBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroPhone: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  heroBadgeText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  walletCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -16, borderRadius: RADIUS.xl, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  walletLabel: { fontSize: 12, color: COLORS.gray },
  walletAmt: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  walletBtn: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full },
  walletBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  quickBtn: { flex: 1, minWidth: '22%', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', gap: 8 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#0F172A', textAlign: 'center' },

  section: { paddingHorizontal: 16, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  editBtn: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },

  infoCard: { backgroundColor: '#fff', borderRadius: RADIUS.xl, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border + '60' },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 2 },
  infoVal: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  infoInput: { fontSize: 14, fontWeight: '600', color: '#0F172A', borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingBottom: 2 },

  cancelBtn: { alignSelf: 'center', marginTop: 12 },
  cancelBtnText: { fontSize: 14, color: COLORS.error },

  logoutBtn: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#fff', borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.error },
});
