import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { notifAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const ICON_MAP = {
  BROADCAST: { icon: 'megaphone', color: COLORS.primary },
  INFO: { icon: 'information-circle', color: COLORS.primary },
  ALERTE: { icon: 'warning', color: COLORS.warning },
  PROMOTION: { icon: 'gift', color: COLORS.success },
};

export default function NotificationsScreen({ navigation }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { fetchNotifs(); }, []));

  const fetchNotifs = async () => {
    try {
      const res = await notifAPI.list();
      setNotifs(Array.isArray(res.data) ? res.data : []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const now = new Date();
    const date = new Date(d);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifs.length > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{notifs.length}</Text></View>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(item, i) => String(item.id || i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifs(); }} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>Vous serez notifié des informations importantes ici.</Text>
          </View>
        }
        renderItem={({ item: n }) => {
          const cfg = ICON_MAP[n.type_notification] || ICON_MAP.BROADCAST;
          return (
            <View style={[styles.card, SHADOW.small]}>
              <View style={[styles.iconBox, { backgroundColor: cfg.color + '15' }]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={styles.content}>
                <View style={styles.topRow}>
                  <Text style={styles.title} numberOfLines={1}>{n.titre}</Text>
                  <Text style={styles.time}>{formatDate(n.date_creation)}</Text>
                </View>
                <Text style={styles.message}>{n.message}</Text>
                {n.envoye_par && (
                  <Text style={styles.sender}>De : {n.envoye_par}</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#fff' },
  badge: { backgroundColor: COLORS.error, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  list: { padding: 16 },

  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', gap: 12, marginBottom: 10 },
  iconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A' },
  time: { fontSize: 11, color: COLORS.gray, flexShrink: 0 },
  message: { fontSize: 13, color: COLORS.gray, lineHeight: 19 },
  sender: { fontSize: 11, color: COLORS.primary, marginTop: 6, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16 },
  emptyText: { fontSize: 13, color: COLORS.gray, marginTop: 6, textAlign: 'center' },
});
