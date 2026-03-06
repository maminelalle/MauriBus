import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { notificationAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const TYPE_CONFIG = {
  BROADCAST: { label: 'Tous les chauffeurs', color: COLORS.primary, bg: COLORS.primary + '15', icon: 'megaphone' },
  INDIVIDUEL: { label: 'Message personnel', color: COLORS.accent, bg: COLORS.accent + '15', icon: 'person' },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.list();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={notifications}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={[COLORS.primary]} />
      }
      ListHeaderComponent={
        <View style={styles.headerInfo}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
          <Text style={styles.headerInfoText}>Messages officiels de l'administration MauriBus</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={40} color={COLORS.lightGray} />
          </View>
          <Text style={styles.emptyTitle}>Aucun message</Text>
          <Text style={styles.emptySub}>Vous n'avez aucun message de l'administration</Text>
        </View>
      }
      renderItem={({ item }) => {
        const cfg = TYPE_CONFIG[item.type_notification] || TYPE_CONFIG.BROADCAST;
        return (
          <View style={[styles.notifCard, SHADOW.small]}>
            {/* Icon + type badge */}
            <View style={styles.notifTop}>
              <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={styles.notifMeta}>
                <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.typePillText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <Text style={styles.notifDate}>{formatDate(item.date_creation)}</Text>
              </View>
            </View>

            {/* Content */}
            <Text style={styles.notifTitle}>{item.titre}</Text>
            <Text style={styles.notifMessage}>{item.message}</Text>

            {/* Sender */}
            {item.envoye_par ? (
              <View style={styles.senderRow}>
                <Ionicons name="person-circle-outline" size={14} color={COLORS.lightGray} />
                <Text style={styles.senderText}>Par {item.envoye_par}</Text>
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.success + '10', borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4,
  },
  headerInfoText: { fontSize: 12, color: COLORS.success, fontWeight: '600', flex: 1 },

  notifCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16,
  },
  notifTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  notifIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  notifMeta: { flex: 1, justifyContent: 'center', gap: 4 },
  typePill: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  typePillText: { fontSize: 11, fontWeight: '700' },
  notifDate: { fontSize: 11, color: COLORS.lightGray },

  notifTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 6 },
  notifMessage: { fontSize: 14, color: COLORS.gray, lineHeight: 21, marginBottom: 10 },

  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  senderText: { fontSize: 12, color: COLORS.lightGray },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.lightGray, textAlign: 'center', paddingHorizontal: 32 },
});
