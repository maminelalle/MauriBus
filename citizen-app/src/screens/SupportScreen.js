import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const FAQ = [
  {
    q: 'Comment recharger mon wallet ?',
    a: 'Envoyez le montant souhaité via Bankily au numéro 46 00 00 00, puis dans l\'onglet Wallet, cliquez sur "Recharger" et fournissez la référence et la capture Bankily. Un administrateur validera votre recharge.',
  },
  {
    q: 'Comment payer mon trajet ?',
    a: 'Depuis l\'écran d\'une ligne, cliquez sur "Payer ce trajet". Choisissez votre méthode de paiement (Wallet, Bankily ou Espèces) et confirmez.',
  },
  {
    q: 'Pourquoi mon solde n\'a pas été crédité ?',
    a: 'Les recharges sont validées manuellement par un administrateur dans un délai de quelques heures. Vérifiez le statut dans l\'historique des transactions.',
  },
  {
    q: 'Comment voir les bus en temps réel ?',
    a: 'Depuis l\'accueil, la carte affiche les bus actifs. Cliquez sur "Agrandir" ou allez dans "Bus Live" pour la carte complète.',
  },
  {
    q: 'Puis-je annuler un paiement ?',
    a: 'Les paiements wallet sont traités immédiatement. Contactez le support pour toute demande de remboursement.',
  },
  {
    q: 'Comment modifier mes informations ?',
    a: 'Allez dans l\'onglet Profil, cliquez sur "Modifier" pour changer votre nom, prénom et email. Le téléphone et le NNI ne peuvent pas être modifiés.',
  },
];

const CONTACTS = [
  { icon: 'call', label: 'Appeler le support', value: '+222 46 00 00 00', action: () => Linking.openURL('tel:+22246000000') },
  { icon: 'logo-whatsapp', label: 'WhatsApp', value: '+222 46 00 00 00', action: () => Linking.openURL('whatsapp://send?phone=22246000000') },
  { icon: 'mail', label: 'Email', value: 'support@mauribus.mr', action: () => Linking.openURL('mailto:support@mauribus.mr') },
];

export default function SupportScreen({ navigation }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Support & Aide</Text>
          <Text style={styles.headerSub}>Nous sommes là pour vous aider</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Contact cards */}
        <Text style={styles.sectionTitle}>Nous contacter</Text>
        {CONTACTS.map(c => (
          <TouchableOpacity key={c.label} style={[styles.contactCard, SHADOW.small]} onPress={c.action} activeOpacity={0.8}>
            <View style={[styles.contactIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name={c.icon} size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Text style={styles.contactVal}>{c.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
          </TouchableOpacity>
        ))}

        {/* Hours */}
        <View style={[styles.hoursCard, SHADOW.small]}>
          <Ionicons name="time-outline" size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hoursTitle}>Horaires du support</Text>
            <Text style={styles.hoursText}>Lun – Sam : 8h00 – 20h00</Text>
            <Text style={styles.hoursText}>Dimanche : 9h00 – 17h00</Text>
          </View>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Questions fréquentes</Text>
        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, SHADOW.small, expanded === i && styles.faqCardOpen]}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.85}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray} />
            </View>
            {expanded === i && (
              <Text style={styles.faqA}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  scroll: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },

  contactCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  contactIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  contactVal: { fontSize: 13, color: COLORS.gray, marginTop: 2 },

  hoursCard: { backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  hoursTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  hoursText: { fontSize: 13, color: '#0F172A' },

  faqCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 8 },
  faqCardOpen: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 20 },
  faqA: { fontSize: 13, color: COLORS.gray, lineHeight: 20, marginTop: 10 },
});
