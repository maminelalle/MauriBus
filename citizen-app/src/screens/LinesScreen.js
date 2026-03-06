import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { linesAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function LinesScreen({ navigation }) {
  const [lines, setLines] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { fetchLines(); }, []));

  const fetchLines = async () => {
    try {
      const res = await linesAPI.list();
      const data = Array.isArray(res.data) ? res.data : [];
      setLines(data);
      setFiltered(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) { setFiltered(lines); return; }
    const q = text.toLowerCase();
    setFiltered(lines.filter(l =>
      l.nom?.toLowerCase().includes(q) ||
      l.code?.toLowerCase().includes(q) ||
      l.terminus_depart?.toLowerCase().includes(q) ||
      l.terminus_arrivee?.toLowerCase().includes(q)
    ));
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lignes de bus</Text>
        <Text style={styles.headerSub}>{lines.length} lignes disponibles</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une ligne..."
          placeholderTextColor={COLORS.gray}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLines(); }} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bus-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Aucune ligne trouvée</Text>
          </View>
        }
        renderItem={({ item: l }) => (
          <TouchableOpacity
            style={[styles.card, SHADOW.small]}
            onPress={() => navigation.navigate('LineDetail', { line: l })}
            activeOpacity={0.85}
          >
            <View style={[styles.codeBox, { backgroundColor: l.couleur || COLORS.primary }]}>
              <Text style={styles.codeText}>{l.code}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{l.nom}</Text>
              <View style={styles.routeRow}>
                <Ionicons name="location-outline" size={12} color={COLORS.gray} />
                <Text style={styles.route} numberOfLines={1}>{l.terminus_depart}</Text>
                <Ionicons name="arrow-forward" size={12} color={COLORS.gray} />
                <Text style={styles.route} numberOfLines={1}>{l.terminus_arrivee}</Text>
              </View>
              {l.frequence_minutes && (
                <View style={styles.freqRow}>
                  <Ionicons name="time-outline" size={11} color={COLORS.primary} />
                  <Text style={styles.freq}>Toutes les {l.frequence_minutes} min</Text>
                </View>
              )}
            </View>
            <View style={styles.tarifCol}>
              <Text style={styles.tarifVal}>{parseFloat(l.tarif_base || 0).toFixed(0)}</Text>
              <Text style={styles.tarifUnit}>MRU</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: -16, borderRadius: RADIUS.lg,
    paddingHorizontal: 14, paddingVertical: 10, ...StyleSheet.flatten({ elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }),
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },

  list: { padding: 16, paddingTop: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
  },
  codeBox: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  codeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  route: { fontSize: 11, color: COLORS.gray, flexShrink: 1 },
  freqRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  freq: { fontSize: 11, color: COLORS.primary, fontWeight: '500' },
  tarifCol: { alignItems: 'center' },
  tarifVal: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  tarifUnit: { fontSize: 10, color: COLORS.gray },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 14, color: COLORS.gray },
});
