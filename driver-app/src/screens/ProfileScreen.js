import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const { driver, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const initials = `${driver.prenom?.[0] || ''}${driver.nom?.[0] || ''}`.toUpperCase();
  const bus = driver.bus;
  const line = bus?.lignes?.[0];

  const infoItems = [
    { icon: 'call-outline', label: 'Téléphone', value: driver.telephone || 'Non renseigné', color: COLORS.primary },
    { icon: 'mail-outline', label: 'Email', value: driver.email || 'Non renseigné', color: COLORS.accent },
    { icon: 'card-outline', label: 'NNI', value: driver.nni || 'Non renseigné', color: COLORS.gray },
    { icon: 'location-outline', label: 'Adresse', value: driver.adresse || 'Non renseigné', color: COLORS.warning },
    { icon: 'ribbon-outline', label: 'Permis', value: driver.permis_conduire || 'Non renseigné', color: COLORS.success },
    { icon: 'calendar-outline', label: 'Date d\'embauche', value: driver.date_embauche ? new Date(driver.date_embauche).toLocaleDateString('fr-FR') : 'Non renseigné', color: COLORS.dark },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Avatar hero ── */}
      <View style={styles.heroSection}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={[styles.onlineDot, { backgroundColor: driver.is_online ? COLORS.success : COLORS.lightGray }]} />
        </View>

        {/* Name */}
        <Text style={styles.driverName}>{driver.prenom} {driver.nom}</Text>
        <Text style={styles.driverSub}>{driver.is_online ? 'En ligne' : 'Hors ligne'}</Text>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="card-outline" size={13} color={COLORS.primary} />
            <Text style={styles.badgeText}>{driver.matricule}</Text>
          </View>
          {bus && (
            <View style={[styles.badge, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="bus-outline" size={13} color={COLORS.primary} />
              <Text style={[styles.badgeText, { color: COLORS.primary }]}>Bus {bus.numero_bus}</Text>
            </View>
          )}
          {line && (
            <View style={[styles.badge, { backgroundColor: line.couleur + '25' || COLORS.accent + '15' }]}>
              <Ionicons name="git-branch-outline" size={13} color={line.couleur || COLORS.accent} />
              <Text style={[styles.badgeText, { color: line.couleur || COLORS.accent }]}>{line.code}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Bus info card ── */}
      {bus && (
        <View style={[styles.sectionCard, SHADOW.small]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="bus" size={18} color={COLORS.primary} />
            <Text style={styles.sectionCardTitle}>Bus assigné</Text>
          </View>
          <InfoRow label="Numéro" value={`Bus ${bus.numero_bus}`} />
          <InfoRow label="Immatriculation" value={bus.plaque || '—'} />
          <InfoRow label="Marque / Modèle" value={`${bus.marque || ''} ${bus.modele || ''}`.trim() || '—'} />
          <InfoRow label="Capacité" value={bus.capacite ? `${bus.capacite} places` : '—'} />
          {line && <InfoRow label="Ligne" value={`${line.code} — ${line.nom}`} last />}
        </View>
      )}

      {/* ── Personal info ── */}
      <View style={[styles.sectionCard, SHADOW.small]}>
        <View style={styles.sectionCardHeader}>
          <Ionicons name="person-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sectionCardTitle}>Informations personnelles</Text>
        </View>
        {infoItems.map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.infoRow, idx === infoItems.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.6}
          >
            <View style={[styles.infoIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{item.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Status card ── */}
      <View style={[styles.sectionCard, SHADOW.small]}>
        <View style={styles.sectionCardHeader}>
          <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sectionCardTitle}>Statut du compte</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadgeLarge, {
            backgroundColor: driver.statut === 'ACTIF' ? COLORS.success + '15' : COLORS.danger + '15'
          }]}>
            <Ionicons
              name={driver.statut === 'ACTIF' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={driver.statut === 'ACTIF' ? COLORS.success : COLORS.danger}
            />
            <Text style={[styles.statusBadgeText, {
              color: driver.statut === 'ACTIF' ? COLORS.success : COLORS.danger
            }]}>
              Compte {driver.statut === 'ACTIF' ? 'actif' : driver.statut?.toLowerCase() || 'inactif'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={[styles.sectionCard, SHADOW.small]}>
        <ActionRow
          icon="notifications-outline"
          label="Notifications Admin"
          color={COLORS.accent}
          onPress={() => navigation.navigate('Notifications')}
        />
        <ActionRow
          icon="lock-closed-outline"
          label="Changer mot de passe"
          color={COLORS.primary}
          onPress={() => Alert.alert('Changement de mot de passe', 'Contactez votre administrateur pour modifier votre mot de passe.')}
        />
        <ActionRow
          icon="call-outline"
          label="Contacter le support"
          color={COLORS.warning}
          onPress={() => Alert.alert('Support', 'Appelez le +222 XX XX XX XX pour toute assistance.')}
        />
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>MauriBus Chauffeur v1.0</Text>
    </ScrollView>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.simpleRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.simpleLabel}>{label}</Text>
      <Text style={styles.simpleValue}>{value}</Text>
    </View>
  );
}

function ActionRow({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.infoIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.infoContent, { color: COLORS.dark, fontWeight: '600', fontSize: 15, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  // Hero section
  heroSection: {
    backgroundColor: COLORS.primary,
    alignItems: 'center', paddingTop: 36, paddingBottom: 32, paddingHorizontal: 20,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    marginBottom: 16,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff',
  },
  driverName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  driverSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Section card
  sectionCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, marginHorizontal: 16, marginBottom: 14, overflow: 'hidden',
  },
  sectionCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  sectionCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark },

  // Simple row (for bus info)
  simpleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  simpleLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  simpleValue: { fontSize: 13, color: COLORS.dark, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  // Info row
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.lightGray, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600' },

  // Status
  statusRow: { padding: 16 },
  statusBadgeLarge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.lg, alignSelf: 'flex-start',
  },
  statusBadgeText: { fontSize: 14, fontWeight: '700' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.danger, borderRadius: RADIUS.xl, marginHorizontal: 16, marginBottom: 12,
    paddingVertical: 16,
    shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  logoutText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.lightGray, marginBottom: 8 },
});
