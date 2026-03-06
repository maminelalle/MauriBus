import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { reportAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const TYPES = [
  { key: 'ACCIDENT', label: 'Accident', icon: 'car-sport-outline', color: COLORS.danger },
  { key: 'PANNE_MECANIQUE', label: 'Panne mécanique', icon: 'build-outline', color: COLORS.warning },
  { key: 'INCIDENT_ROUTE', label: 'Incident route', icon: 'warning-outline', color: COLORS.warning },
  { key: 'PLAINTE_PASSAGER', label: 'Plainte passager', icon: 'person-outline', color: COLORS.accent },
  { key: 'PERTE_OBJET', label: 'Perte d\'objet', icon: 'bag-outline', color: COLORS.gray },
  { key: 'AUTRE', label: 'Autre', icon: 'ellipsis-horizontal', color: COLORS.gray },
];

const PRIORITIES = [
  { key: 'BASSE', label: 'Basse', color: COLORS.gray },
  { key: 'NORMALE', label: 'Normale', color: COLORS.accent },
  { key: 'HAUTE', label: 'Haute', color: COLORS.warning },
  { key: 'CRITIQUE', label: 'Critique !', color: COLORS.danger },
];

export default function ReportScreen({ navigation }) {
  const { driver } = useAuth();
  const [type, setType] = useState('INCIDENT_ROUTE');
  const [priority, setPriority] = useState('NORMALE');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!titre.trim() || !description.trim()) {
      Alert.alert('Attention', 'Veuillez remplir le titre et la description.');
      return;
    }
    setSending(true);
    try {
      await reportAPI.create({
        bus_id: driver.bus?.id,
        type_signalement: type,
        titre: titre.trim(),
        description: description.trim(),
        priorite: priority,
      });
      Alert.alert('Envoyé !', 'Votre signalement a bien été transmis à l\'administration.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.detail || 'Impossible d\'envoyer le signalement');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Type d&apos;incident</Text>
      <View style={styles.typesGrid}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeBtn, type === t.key && { borderColor: t.color, backgroundColor: t.color + '10' }]}
            onPress={() => setType(t.key)}
          >
            <Ionicons name={t.icon} size={22} color={type === t.key ? t.color : COLORS.gray} />
            <Text style={[styles.typeLabel, type === t.key && { color: t.color }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Priorité</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.priorityBtn, priority === p.key && { backgroundColor: p.color, borderColor: p.color }]}
            onPress={() => setPriority(p.key)}
          >
            <Text style={[styles.priorityText, priority === p.key && { color: '#fff' }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Titre</Text>
      <TextInput
        style={styles.input}
        value={titre}
        onChangeText={setTitre}
        placeholder="Ex: Panne au carrefour de Ksar"
        placeholderTextColor={COLORS.lightGray}
      />

      <Text style={styles.section}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décrivez l'incident en détail..."
        placeholderTextColor={COLORS.lightGray}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.sendBtnText}>Envoyer le signalement</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40, gap: 10 },

  section: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginTop: 8 },

  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeBtn: {
    width: '47%', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOW.small,
  },
  typeLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray, textAlign: 'center' },

  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff',
  },
  priorityText: { fontSize: 12, fontWeight: '700', color: COLORS.gray },

  input: {
    backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.dark,
  },
  textarea: { height: 120, paddingTop: 12 },

  sendBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
