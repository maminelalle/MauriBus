import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [langue, setLangue] = useState('fr');

  const SECTIONS = [
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notifications push',
          desc: 'Recevoir des alertes en temps réel',
          right: <Switch value={notifPush} onValueChange={setNotifPush} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor="#fff" />,
        },
        {
          icon: 'mail-outline',
          label: 'Notifications email',
          desc: 'Recevoir des mises à jour par email',
          right: <Switch value={notifEmail} onValueChange={setNotifEmail} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor="#fff" />,
        },
      ],
    },
    {
      title: 'Langue',
      items: [
        {
          icon: 'globe-outline',
          label: 'Langue de l\'application',
          desc: langue === 'fr' ? 'Français' : 'العربية',
          onPress: () => Alert.alert('Langue', 'Choisissez votre langue', [
            { text: 'Français', onPress: () => setLangue('fr') },
            { text: 'العربية', onPress: () => setLangue('ar') },
            { text: 'Annuler', style: 'cancel' },
          ]),
        },
      ],
    },
    {
      title: 'Application',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'À propos de MauriBus',
          desc: 'Version 1.0.0',
          onPress: () => Alert.alert('MauriBus Citoyen', 'Version 1.0.0\n\nApplication de transport en commun de Nouakchott.\n\n© 2025 MauriBus'),
        },
        {
          icon: 'shield-outline',
          label: 'Politique de confidentialité',
          onPress: () => Alert.alert('Confidentialité', 'Vos données personnelles sont protégées et ne sont jamais partagées avec des tiers.'),
        },
        {
          icon: 'document-text-outline',
          label: 'Conditions d\'utilisation',
          onPress: () => Alert.alert('CGU', 'En utilisant MauriBus, vous acceptez nos conditions générales d\'utilisation.'),
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          icon: 'trash-outline',
          label: 'Supprimer mon compte',
          desc: 'Action irréversible',
          danger: true,
          onPress: () => Alert.alert(
            'Supprimer le compte',
            'Cette action est irréversible. Contactez le support pour supprimer votre compte.',
            [{ text: 'OK' }]
          ),
        },
        {
          icon: 'log-out-outline',
          label: 'Se déconnecter',
          danger: true,
          onPress: () => Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnecter', style: 'destructive', onPress: logout },
          ]),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={[styles.card, SHADOW.small]}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}
                  onPress={item.onPress}
                  activeOpacity={item.onPress ? 0.7 : 1}
                  disabled={!item.onPress && !item.right}
                >
                  <View style={[styles.rowIcon, { backgroundColor: (item.danger ? COLORS.error : COLORS.primary) + '12' }]}>
                    <Ionicons name={item.icon} size={20} color={item.danger ? COLORS.error : COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, item.danger && { color: COLORS.error }]}>{item.label}</Text>
                    {item.desc && <Text style={styles.rowDesc}>{item.desc}</Text>}
                  </View>
                  {item.right
                    ? item.right
                    : item.onPress && <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                  }
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },

  scroll: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 },

  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border + '50' },
  rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  rowDesc: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
});
