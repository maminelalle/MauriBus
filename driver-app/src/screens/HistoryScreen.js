import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { tripAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');

const FILTERS = [
  { key: 'planned', label: 'Planifiés', icon: 'calendar-outline', color: COLORS.accent },
  { key: 'active', label: 'En cours', icon: 'navigate', color: COLORS.success },
  { key: 'today', label: "Aujourd'hui", icon: 'today-outline', color: COLORS.primary },
  { key: 'week', label: 'Semaine', icon: 'calendar-outline', color: COLORS.gray },
];

const STATUT_CONFIG = {
  PLANIFIEE: { label: 'Planifié', color: COLORS.accent, bg: COLORS.accent + '15', icon: 'calendar-outline' },
  EN_COURS: { label: 'En cours', color: COLORS.success, bg: COLORS.success + '15', icon: 'navigate' },
  COMPLETEE: { label: 'Terminé', color: COLORS.primary, bg: COLORS.primary + '15', icon: 'checkmark-circle' },
  ANNULEE: { label: 'Annulé', color: COLORS.danger, bg: COLORS.danger + '15', icon: 'close-circle' },
  PAUSE: { label: 'En pause', color: COLORS.warning, bg: COLORS.warning + '15', icon: 'pause-circle' },
};

export default function HistoryScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('planned');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const fetchTrips = async () => {
    try {
      const res = await tripAPI.list();
      setTrips(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const applyFilter = (list) => {
    const now = new Date();
    const todayStr = now.toDateString();
    switch (filter) {
      case 'planned': return list.filter((t) => t.statut === 'PLANIFIEE');
      case 'active': return list.filter((t) => t.statut === 'EN_COURS' || t.statut === 'PAUSE');
      case 'today': {
        return list.filter((t) => {
          const ref = t.date_planifiee || t.date_debut;
          return new Date(ref).toDateString() === todayStr;
        });
      }
      case 'week': {
        return list.filter((t) => {
          const ref = t.date_planifiee || t.date_debut;
          const diff = (now - new Date(ref)) / 86400000;
          return diff >= -7 && diff <= 7;
        });
      }
      default: return list;
    }
  };

  const filtered = applyFilter(trips);
  const totalRevenue = filtered.reduce((s, t) => s + parseFloat(t.revenus || 0), 0);
  const totalPassengers = filtered.reduce((s, t) => s + (t.nombre_passagers || 0), 0);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Filter chips ── */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === f.key && { backgroundColor: f.color }]}
              onPress={() => setFilter(f.key)}
            >
              <Ionicons name={f.icon} size={14} color={filter === f.key ? '#fff' : f.color} />
              <Text style={[styles.filterChipText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── Summary bar ── */}
      <View style={styles.summaryBar}>
        <SummaryItem icon="list" label="Trajets" value={filtered.length} color={COLORS.primary} />
        <View style={styles.summaryDiv} />
        <SummaryItem icon="cash-outline" label="Revenus" value={`${Math.round(totalRevenue).toLocaleString('fr-FR')} MRU`} color={COLORS.success} />
        <View style={styles.summaryDiv} />
        <SummaryItem icon="people-outline" label="Passagers" value={totalPassengers} color={COLORS.warning} />
      </View>

      {/* ── Trips list ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrips(); }} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bus-outline" size={40} color={COLORS.lightGray} />
            </View>
            <Text style={styles.emptyTitle}>Aucun trajet</Text>
            <Text style={styles.emptySub}>Vos trajets apparaîtront ici</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUT_CONFIG[item.statut] || STATUT_CONFIG.COMPLETEE;
          const rev = parseFloat(item.revenus || 0);
          const ligne = item.ligne;
          const isInteractive = item.statut === 'EN_COURS' || item.statut === 'PLANIFIEE';
          return (
            <TouchableOpacity
              style={[styles.tripCard, SHADOW.small]}
              onPress={() => {
                if (item.statut === 'EN_COURS') navigation.navigate('Trip', { trip: item });
                else if (item.statut === 'PLANIFIEE') navigation.navigate('Trip', { trip: item, planned: true });
              }}
              activeOpacity={isInteractive ? 0.8 : 1}
            >
              {/* Card header */}
              <View style={styles.tripCardHeader}>
                <View style={styles.busTag}>
                  <Ionicons name="bus" size={13} color={COLORS.primary} />
                  <Text style={styles.busTagText}>Bus {item.bus?.numero_bus || '—'}</Text>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                  <Text style={[styles.statutText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              {/* Route visualization */}
              <View style={styles.routeViz}>
                <View style={styles.routeLeft}>
                  <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
                  <View style={styles.routeLine} />
                  <View style={[styles.routeDot, { backgroundColor: COLORS.warning }]} />
                </View>
                <View style={styles.routeRight}>
                  <Text style={styles.routeStop} numberOfLines={1}>
                    {ligne?.nom?.split('→')[0]?.trim() || 'Départ'}
                  </Text>
                  <View style={styles.routeSpacer} />
                  <Text style={styles.routeStop} numberOfLines={1}>
                    {ligne?.nom?.split('→')[1]?.trim() || 'Destination'}
                  </Text>
                </View>
                {rev > 0 && (
                  <View style={[styles.revChip, { backgroundColor: rev >= 2000 ? COLORS.success + '15' : COLORS.warning + '15' }]}>
                    <Text style={[styles.revText, { color: rev >= 2000 ? COLORS.success : COLORS.warning }]}>
                      {Math.round(rev).toLocaleString('fr-FR')} MRU
                    </Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.tripFooter}>
                <View style={styles.tripMeta}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.lightGray} />
                  <Text style={styles.tripMetaText}>
                    {item.date_planifiee ? `Prévu: ${formatDate(item.date_planifiee)}` : formatDate(item.date_debut)}
                  </Text>
                </View>
                {item.duree_reelle_secondes > 0 && (
                  <View style={styles.tripMeta}>
                    <Ionicons name="time-outline" size={12} color={COLORS.lightGray} />
                    <Text style={styles.tripMetaText}>{formatDuration(item.duree_reelle_secondes)}</Text>
                  </View>
                )}
                {item.nombre_passagers > 0 && (
                  <View style={styles.tripMeta}>
                    <Ionicons name="people-outline" size={12} color={COLORS.lightGray} />
                    <Text style={styles.tripMetaText}>{item.nombre_passagers} pass.</Text>
                  </View>
                )}
                {item.statut === 'EN_COURS' && (
                  <View style={styles.continueChip}>
                    <Text style={styles.continueChipText}>Continuer →</Text>
                  </View>
                )}
                {item.statut === 'PLANIFIEE' && (
                  <View style={[styles.continueChip, { backgroundColor: COLORS.accent + '15' }]}>
                    <Text style={[styles.continueChipText, { color: COLORS.accent }]}>Démarrer →</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function SummaryItem({ icon, label, value, color }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Filter chips
  filterBar: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.border },
  filterList: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full, backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },

  // Summary bar
  summaryBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingVertical: 14,
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDiv: { width: 1, height: 32, backgroundColor: COLORS.border },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },

  // List
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },

  // Trip card
  tripCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16,
  },
  tripCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  busTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  busTagText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  statutBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  statutText: { fontSize: 12, fontWeight: '700' },

  // Route visualization
  routeViz: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  routeLeft: { alignItems: 'center', marginRight: 12, width: 12 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, height: 24, backgroundColor: COLORS.border, marginVertical: 3 },
  routeRight: { flex: 1, justifyContent: 'space-between', gap: 20 },
  routeStop: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  routeSpacer: { height: 12 },
  revChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, marginLeft: 10, alignSelf: 'center',
  },
  revText: { fontSize: 13, fontWeight: '800' },

  // Footer
  tripFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  tripMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripMetaText: { fontSize: 11, color: COLORS.lightGray, fontWeight: '500' },
  continueChip: {
    marginLeft: 'auto', backgroundColor: COLORS.success + '15',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  continueChipText: { fontSize: 11, fontWeight: '700', color: COLORS.success },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.lightGray },
});
