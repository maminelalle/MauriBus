import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ratingAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const EMOJIS = ['😡', '😕', '😐', '🙂', '😄'];
const LABELS = ['Très mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent'];

export default function RatingScreen({ route, navigation }) {
  const { ticketId, chauffeurId, chauffeurNom } = route.params || {};
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await ratingAPI.submit({
        ticket_id: ticketId,
        chauffeur_id: chauffeurId,
        note,
        commentaire,
      });
      Alert.alert('Merci !', 'Votre avis a été envoyé.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.detail || 'Impossible d\'envoyer l\'avis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Noter le chauffeur</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Driver card */}
        <View style={[styles.driverCard, SHADOW.small]}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={32} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.driverLabel}>Chauffeur</Text>
            <Text style={styles.driverName}>{chauffeurNom || '—'}</Text>
          </View>
        </View>

        {/* Stars */}
        <View style={[styles.card, SHADOW.small]}>
          <Text style={styles.sectionTitle}>Votre note</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setNote(n)} activeOpacity={0.7}>
                <Ionicons
                  name={n <= note ? 'star' : 'star-outline'}
                  size={40}
                  color={n <= note ? COLORS.warning : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.emoji}>{EMOJIS[note - 1]}</Text>
          <Text style={styles.noteLabel}>{LABELS[note - 1]}</Text>
        </View>

        {/* Comment */}
        <View style={[styles.card, SHADOW.small]}>
          <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
          <TextInput
            style={styles.input}
            value={commentaire}
            onChangeText={setCommentaire}
            placeholder="Partagez votre expérience..."
            placeholderTextColor={COLORS.lightGray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Envoyer l'avis</Text>
              </>}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },

  scroll: { padding: 16, gap: 14 },

  driverCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  driverAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  driverLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 2 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },

  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16, alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 16, alignSelf: 'flex-start' },

  starsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  emoji: { fontSize: 36, marginBottom: 8 },
  noteLabel: { fontSize: 16, fontWeight: '700', color: COLORS.warning },

  input: {
    width: '100%', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 14, minHeight: 100,
    fontSize: 14, color: '#0F172A', backgroundColor: COLORS.background,
  },

  submitBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    paddingVertical: 16, borderRadius: RADIUS.xl,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
