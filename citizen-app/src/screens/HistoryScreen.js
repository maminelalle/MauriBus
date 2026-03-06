import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { walletAPI, historyAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const TX_CONFIG = {
  RECHARGE:      { label: 'Recharge Bankily', icon: 'arrow-down-circle', color: COLORS.success, sign: '+' },
  PAIEMENT:      { label: 'Paiement trajet',  icon: 'bus',               color: COLORS.primary, sign: '-' },
  REMBOURSEMENT: { label: 'Remboursement',    icon: 'refresh-circle',    color: COLORS.warning, sign: '+' },
};
const STATUT_TX = {
  VALIDE:     { label: 'Validé',     color: COLORS.success },
  EN_ATTENTE: { label: 'En attente', color: COLORS.warning },
  REFUSE:     { label: 'Refusé',     color: COLORS.danger  },
};
const STATUT_TICKET = {
  PAYE:    { label: 'Valide',   color: COLORS.success, icon: 'checkmark-circle' },
  UTILISE: { label: 'Utilisé',  color: COLORS.gray,    icon: 'checkmark-done-circle' },
  ANNULE:  { label: 'Annulé',   color: COLORS.danger,  icon: 'close-circle' },
};

const TABS = ['Transactions', 'Mes Trajets'];

export default function HistoryScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState(0);

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const fetchAll = async () => {
    try {
      const [txRes, tripsRes] = await Promise.all([
        walletAPI.transactions(),
        historyAPI.list(),
      ]);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      setTrips(Array.isArray(tripsRes.data) ? tripsRes.data : []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const totalRecharges = transactions
    .filter(t => t.type_transaction === 'RECHARGE' && t.statut === 'VALIDE')
    .reduce((s, t) => s + parseFloat(t.montant || 0), 0);
  const totalPaiements = transactions
    .filter(t => t.type_transaction === 'PAIEMENT')
    .reduce((s, t) => s + parseFloat(t.montant || 0), 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="arrow-down-circle" size={16} color="#fff" />
            <Text style={styles.summaryLabel}>Rechargé</Text>
            <Text style={styles.summaryVal}>{totalRecharges.toFixed(0)} MRU</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="bus" size={16} color="#fff" />
            <Text style={styles.summaryLabel}>Dépensé</Text>
            <Text style={styles.summaryVal}>{totalPaiements.toFixed(0)} MRU</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="ticket" size={16} color="#fff" />
            <Text style={styles.summaryLabel}>Trajets</Text>
            <Text style={styles.summaryVal}>{trips.length}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 0 ? (
        /* ── Transactions ── */
        <FlatList
          data={transactions}
          keyExtractor={(item, i) => String(item.id || i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Aucune transaction</Text>
            </View>
          }
          renderItem={({ item: t }) => {
            const cfg = TX_CONFIG[t.type_transaction] || TX_CONFIG.RECHARGE;
            const statut = STATUT_TX[t.statut] || STATUT_TX.EN_ATTENTE;
            return (
              <View style={[styles.card, SHADOW.small]}>
                <View style={[styles.iconBox, { backgroundColor: cfg.color + '15' }]}>
                  <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.txLabel}>{cfg.label}</Text>
                  {t.description ? <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text> : null}
                  {t.reference_bankily ? <Text style={styles.txRef}>Ref: {t.reference_bankily}</Text> : null}
                  <Text style={styles.txDate}>{formatDate(t.date_creation)}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={[styles.txAmount, { color: t.type_transaction === 'PAIEMENT' ? COLORS.danger : COLORS.success }]}>
                    {cfg.sign}{parseFloat(t.montant || 0).toLocaleString('fr-FR')} MRU
                  </Text>
                  <View style={[styles.statutBadge, { backgroundColor: statut.color + '18' }]}>
                    <Text style={[styles.statutText, { color: statut.color }]}>{statut.label}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      ) : (
        /* ── Mes Trajets ── */
        <FlatList
          data={trips}
          keyExtractor={(item, i) => String(item.id || i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bus-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Aucun trajet</Text>
              <Text style={styles.emptyText}>Vos trajets payés apparaîtront ici.</Text>
            </View>
          }
          renderItem={({ item: t }) => {
            const cfg = STATUT_TICKET[t.statut] || STATUT_TICKET.PAYE;
            const ligne = t.ligne;
            return (
              <TouchableOpacity
                style={[styles.card, SHADOW.small]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Ticket', { ticketId: t.id })}
              >
                {/* Line color stripe */}
                <View style={[styles.lineStripe, { backgroundColor: ligne?.couleur || COLORS.primary }]}>
                  <Text style={styles.lineCode}>{ligne?.code || '?'}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.txLabel}>{ligne?.nom || 'Ligne inconnue'}</Text>
                  {ligne && (
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {ligne.terminus_depart} → {ligne.terminus_arrivee}
                    </Text>
                  )}
                  <Text style={styles.txDate}>{formatDate(t.date_paiement)}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.txAmount}>{parseFloat(t.montant_paye).toFixed(0)} MRU</Text>
                  <View style={[styles.statutBadge, { backgroundColor: cfg.color + '18' }]}>
                    <Ionicons name={cfg.icon} size={10} color={cfg.color} />
                    <Text style={[styles.statutText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Ionicons name="qr-code-outline" size={14} color={COLORS.lightGray} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.lg, padding: 14 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)' },
  summaryVal: { fontSize: 17, fontWeight: '800', color: '#fff' },

  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.background, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: '#fff' },

  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  lineStripe: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  lineCode: { fontSize: 13, fontWeight: '800', color: '#fff' },
  info: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  txDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  txRef: { fontSize: 11, color: COLORS.primary, marginTop: 2, fontWeight: '500' },
  txDate: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 5 },
  txAmount: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  statutBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statutText: { fontSize: 10, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16 },
  emptyText: { fontSize: 13, color: COLORS.gray, marginTop: 6, textAlign: 'center' },
});
