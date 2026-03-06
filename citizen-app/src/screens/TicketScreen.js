import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Share, Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { ticketAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const STATUT_CONFIG = {
  PAYE:    { label: 'Valide',   color: COLORS.success, bg: COLORS.success + '15', icon: 'checkmark-circle' },
  UTILISE: { label: 'Utilisé',  color: COLORS.gray,    bg: COLORS.gray + '15',    icon: 'checkmark-done-circle' },
  ANNULE:  { label: 'Annulé',   color: COLORS.danger,  bg: COLORS.danger + '15',  icon: 'close-circle' },
};

export default function TicketScreen({ route, navigation }) {
  const { ticketId, ticket: initialTicket } = route.params || {};
  const [ticket, setTicket] = useState(initialTicket || null);
  const [loading, setLoading] = useState(!initialTicket);

  useEffect(() => {
    if (!initialTicket && ticketId) {
      ticketAPI.get(ticketId)
        .then(res => setTicket(res.data))
        .catch(() => Alert.alert('Erreur', 'Ticket introuvable'))
        .finally(() => setLoading(false));
    }
  }, [ticketId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <Ionicons name="ticket-outline" size={48} color={COLORS.lightGray} />
        <Text style={styles.emptyTitle}>Ticket introuvable</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg = STATUT_CONFIG[ticket.statut] || STATUT_CONFIG.PAYE;
  const qrValue = ticket.ticket_code || ticket.id;
  const ligne = ticket.ligne;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Ticket MauriBus\nLigne: ${ligne?.nom || '—'}\nMontant: ${ticket.montant_paye} MRU\nCode: ${qrValue}`,
        title: 'Mon ticket MauriBus',
      });
    } catch {}
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: ligne?.couleur || COLORS.primary }]}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Ticket</Text>
        <TouchableOpacity style={styles.headerShare} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* QR Code card */}
        <View style={[styles.qrCard, SHADOW.medium]}>
          <Text style={styles.qrHint}>
            {ticket.statut === 'PAYE'
              ? 'Présentez ce QR code au chauffeur'
              : ticket.statut === 'UTILISE'
              ? 'Ce ticket a déjà été validé'
              : 'Ce ticket est annulé'}
          </Text>
          <View style={[styles.qrWrap, ticket.statut !== 'PAYE' && styles.qrDimmed]}>
            <QRCode
              value={qrValue}
              size={220}
              color={ticket.statut === 'PAYE' ? '#0F172A' : COLORS.lightGray}
              backgroundColor="#fff"
            />
          </View>
          <Text style={styles.qrCodeText} numberOfLines={1} ellipsizeMode="middle">
            {qrValue}
          </Text>
        </View>

        {/* Ligne info */}
        {ligne && (
          <View style={[styles.card, SHADOW.small]}>
            <View style={styles.cardRow}>
              <View style={[styles.lineCodeBox, { backgroundColor: ligne.couleur || COLORS.primary }]}>
                <Text style={styles.lineCodeText}>{ligne.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName}>{ligne.nom}</Text>
                <Text style={styles.lineRoute}>{ligne.terminus_depart} → {ligne.terminus_arrivee}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Details */}
        <View style={[styles.card, SHADOW.small]}>
          <DetailRow icon="cash-outline" label="Montant payé" value={`${parseFloat(ticket.montant_paye).toFixed(0)} MRU`} />
          <DetailRow icon="wallet-outline" label="Méthode" value={ticket.methode_paiement} />
          <DetailRow icon="calendar-outline" label="Date d'achat" value={formatDate(ticket.date_paiement)} />
          {ticket.bus && (
            <DetailRow icon="bus-outline" label="Bus" value={`Bus ${ticket.bus.numero_bus}`} />
          )}
          {ticket.bus?.chauffeur_nom && (
            <DetailRow icon="person-outline" label="Chauffeur" value={ticket.bus.chauffeur_nom} />
          )}
          {ticket.date_utilisation && (
            <DetailRow icon="checkmark-done-outline" label="Utilisé le" value={formatDate(ticket.date_utilisation)} color={COLORS.success} />
          )}
        </View>

        {/* Rate driver button */}
        {ticket.statut === 'UTILISE' && !ticket.has_rated && ticket.bus?.chauffeur_id && (
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => navigation.navigate('Rating', {
              ticketId: ticket.id,
              chauffeurId: ticket.bus.chauffeur_id,
              chauffeurNom: ticket.bus.chauffeur_nom,
            })}
            activeOpacity={0.85}
          >
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={styles.rateBtnText}>Noter le chauffeur</Text>
          </TouchableOpacity>
        )}

        {ticket.statut === 'UTILISE' && ticket.has_rated && (
          <View style={styles.ratedBadge}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.ratedText}>Vous avez noté ce trajet</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, color }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={COLORS.gray} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20,
  },
  headerBack: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerShare: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  scroll: { padding: 16, alignItems: 'center', gap: 14 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 14, fontWeight: '700' },

  qrCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 24,
    alignItems: 'center', width: '100%',
  },
  qrHint: { fontSize: 13, color: COLORS.gray, marginBottom: 20, textAlign: 'center' },
  qrWrap: { padding: 12, backgroundColor: '#fff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  qrDimmed: { opacity: 0.4 },
  qrCodeText: { fontSize: 11, color: COLORS.lightGray, marginTop: 12, maxWidth: 240 },

  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16, width: '100%', gap: 12 },

  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineCodeBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lineCodeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  lineName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  lineRoute: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { flex: 1, fontSize: 13, color: COLORS.gray },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

  rateBtn: {
    backgroundColor: COLORS.warning, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: RADIUS.xl, width: '100%',
  },
  rateBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  ratedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.warning + '15', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full,
  },
  ratedText: { fontSize: 13, color: COLORS.warning, fontWeight: '600' },

  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginTop: 16, marginBottom: 24 },
  backBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
