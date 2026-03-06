import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { paymentAPI, tripAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const STATUT_PAY = {
  EN_ATTENTE: { label: 'En attente', color: COLORS.warning, bg: COLORS.warning + '15', icon: 'time-outline' },
  VALIDE: { label: 'Validé', color: COLORS.success, bg: COLORS.success + '15', icon: 'checkmark-circle-outline' },
  REFUSE: { label: 'Refusé', color: COLORS.danger, bg: COLORS.danger + '15', icon: 'close-circle-outline' },
};

export default function EarningsScreen() {
  const [payments, setPayments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('week');

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const fetchAll = async () => {
    try {
      const [payRes, tripRes] = await Promise.all([
        paymentAPI.list(),
        tripAPI.list(),
      ]);
      setPayments(Array.isArray(payRes.data) ? payRes.data : (payRes.data.results || []));
      setTrips(Array.isArray(tripRes.data) ? tripRes.data : (tripRes.data.results || []));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const now = new Date();
  const todayStr = now.toDateString();
  const getRevenue = (list) => list.reduce((s, t) => s + parseFloat(t.revenus || 0), 0);

  const todayTrips = trips.filter((t) => new Date(t.date_debut).toDateString() === todayStr);
  const weekTrips = trips.filter((t) => (now - new Date(t.date_debut)) / 86400000 <= 7);
  const monthTrips = trips.filter((t) => new Date(t.date_debut).getMonth() === now.getMonth() && new Date(t.date_debut).getFullYear() === now.getFullYear());

  // Last 7 days bar chart data
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayTrips = trips.filter((t) => new Date(t.date_debut).toDateString() === d.toDateString());
    return {
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      value: getRevenue(dayTrips),
      isToday: d.toDateString() === todayStr,
    };
  });
  const chartMax = Math.max(...chartDays.map((d) => d.value), 1);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} colors={[COLORS.primary]} />
      }
    >
      {/* ── Revenue cards ── */}
      <View style={styles.cardsGrid}>
        <RevenueCard
          label="Aujourd'hui"
          value={getRevenue(todayTrips)}
          trips={todayTrips.length}
          color={COLORS.primary}
        />
        <RevenueCard
          label="Cette semaine"
          value={getRevenue(weekTrips)}
          trips={weekTrips.length}
          color={COLORS.accent}
        />
        <RevenueCard
          label="Ce mois"
          value={getRevenue(monthTrips)}
          trips={monthTrips.length}
          color={COLORS.success}
          full
        />
      </View>

      {/* ── Bar chart ── */}
      <View style={[styles.chartCard, SHADOW.small]}>
        <View style={styles.chartHeader}>
          <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Revenus — 7 derniers jours</Text>
        </View>
        <View style={styles.chart}>
          {chartDays.map((d, i) => (
            <View key={i} style={styles.barGroup}>
              <Text style={styles.barValue}>{d.value > 0 ? `${Math.round(d.value / 1000)}k` : ''}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, (d.value / chartMax) * 80),
                      backgroundColor: d.isToday ? COLORS.primary : COLORS.primary + '40',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, d.isToday && { color: COLORS.primary, fontWeight: '700' }]}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Payments ── */}
      <View style={styles.payHeader}>
        <Ionicons name="wallet-outline" size={18} color={COLORS.dark} />
        <Text style={styles.sectionTitle}>Paiements récents</Text>
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyPay}>
          <View style={styles.emptyPayIcon}>
            <Ionicons name="cash-outline" size={32} color={COLORS.lightGray} />
          </View>
          <Text style={styles.emptyPayText}>Aucun paiement enregistré</Text>
        </View>
      ) : (
        payments.slice(0, 20).map((p) => {
          const cfg = STATUT_PAY[p.statut] || STATUT_PAY.EN_ATTENTE;
          return (
            <View key={p.id} style={[styles.payRow, SHADOW.small]}>
              <View style={[styles.payIconBox, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={styles.payInfo}>
                <Text style={styles.payAmount}>{parseFloat(p.montant).toLocaleString('fr-FR')} MRU</Text>
                <Text style={styles.payType}>
                  {p.type_paiement} · {new Date(p.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
                {p.code_unique ? (
                  <Text style={styles.payCode}>#{p.code_unique}</Text>
                ) : null}
              </View>
              <View style={[styles.payBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.payBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function RevenueCard({ label, value, trips, color, full }) {
  return (
    <View style={[styles.revCard, full && styles.revCardFull, { borderTopColor: color, borderTopWidth: 3 }, SHADOW.small]}>
      <Text style={styles.revLabel}>{label}</Text>
      <Text style={[styles.revValue, { color }]}>{Math.round(value).toLocaleString('fr-FR')}</Text>
      <Text style={styles.revUnit}>MRU</Text>
      <Text style={styles.revTrips}>{trips} trajet{trips !== 1 ? 's' : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Revenue cards
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  revCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff',
    borderRadius: RADIUS.xl, padding: 16, alignItems: 'center',
  },
  revCardFull: { minWidth: '100%' },
  revLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 6, fontWeight: '500' },
  revValue: { fontSize: 26, fontWeight: '800' },
  revUnit: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  revTrips: { fontSize: 11, color: COLORS.lightGray, marginTop: 4 },

  // Chart
  chartCard: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', height: 120, paddingTop: 20,
  },
  barGroup: { flex: 1, alignItems: 'center' },
  barValue: { fontSize: 9, color: COLORS.gray, marginBottom: 4, fontWeight: '600' },
  barTrack: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: 22, borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, color: COLORS.lightGray, marginTop: 6, fontWeight: '500' },

  // Payments
  payHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payRow: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  payIconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  payInfo: { flex: 1 },
  payAmount: { fontSize: 17, fontWeight: '800', color: COLORS.dark },
  payType: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  payCode: { fontSize: 11, color: COLORS.lightGray, marginTop: 2 },
  payBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  payBadgeText: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyPay: { alignItems: 'center', paddingVertical: 32 },
  emptyPayIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyPayText: { fontSize: 14, color: COLORS.lightGray },
});
