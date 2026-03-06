import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal,
  TextInput, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { walletAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const TYPE_LABELS = { RECHARGE: 'Recharge', PAIEMENT: 'Paiement', REMBOURSEMENT: 'Remboursement' };
const TYPE_COLORS = { RECHARGE: COLORS.success, PAIEMENT: COLORS.error, REMBOURSEMENT: COLORS.warning };
const TYPE_ICONS = { RECHARGE: 'arrow-down-circle', PAIEMENT: 'arrow-up-circle', REMBOURSEMENT: 'refresh-circle' };
const STATUT_COLORS = { VALIDE: COLORS.success, EN_ATTENTE: COLORS.warning, REFUSE: COLORS.error };

export default function WalletScreen({ navigation }) {
  const { citizen, updateBalance } = useAuth();
  const [balance, setBalance] = useState(parseFloat(citizen?.wallet_balance || 0));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [montant, setMontant] = useState('');
  const [reference, setReference] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(useCallback(() => { fetchWallet(); }, []));

  const fetchWallet = async () => {
    try {
      const res = await walletAPI.balance();
      setBalance(parseFloat(res.data.balance || 0));
      setTransactions(res.data.transactions || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès à la galerie nécessaire pour envoyer la preuve Bankily.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhoto(result.assets[0]);
    }
  };

  const submitRecharge = async () => {
    if (!montant || isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }
    if (!reference.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer la référence Bankily.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        montant: parseFloat(montant),
        reference_bankily: reference.trim(),
      };
      if (photo?.base64) {
        payload.photo_bankily = `data:image/jpeg;base64,${photo.base64}`;
      }
      await walletAPI.recharge(payload);
      setShowModal(false);
      setMontant('');
      setReference('');
      setPhoto(null);
      Alert.alert('Demande envoyée', 'Votre demande de recharge est en attente de validation par l\'administrateur.');
      fetchWallet();
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.detail || 'Erreur lors de la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Mon Wallet</Text>
        <Text style={styles.balanceAmt}>{balance.toLocaleString('fr-FR')} <Text style={styles.balanceCur}>MRU</Text></Text>
        <Text style={styles.headerSub}>Solde disponible</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Recharger</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate('Payment', {})}>
            <Ionicons name="qr-code-outline" size={22} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Payer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWallet(); }} colors={[COLORS.primary]} />}
      >
        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique des transactions</Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Aucune transaction</Text>
            </View>
          ) : (
            transactions.map((t, i) => (
              <View key={t.id || i} style={[styles.txCard, SHADOW.small]}>
                <View style={[styles.txIcon, { backgroundColor: (TYPE_COLORS[t.type_transaction] || COLORS.gray) + '15' }]}>
                  <Ionicons name={TYPE_ICONS[t.type_transaction] || 'ellipse-outline'} size={22} color={TYPE_COLORS[t.type_transaction] || COLORS.gray} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txType}>{TYPE_LABELS[t.type_transaction] || t.type_transaction}</Text>
                  {t.description ? <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text> : null}
                  <Text style={styles.txDate}>{formatDate(t.date_creation)}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: t.type_transaction === 'PAIEMENT' ? COLORS.error : COLORS.success }]}>
                    {t.type_transaction === 'PAIEMENT' ? '−' : '+'}{parseFloat(t.montant).toLocaleString('fr-FR')} MRU
                  </Text>
                  <View style={[styles.txStatut, { backgroundColor: (STATUT_COLORS[t.statut] || COLORS.gray) + '20' }]}>
                    <Text style={[styles.txStatutText, { color: STATUT_COLORS[t.statut] || COLORS.gray }]}>{t.statut}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Recharge Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recharger via Bankily</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalStep}>1. Envoyez le montant au numéro Bankily MauriBus</Text>
            <View style={styles.bankiNum}>
              <Text style={styles.bankiNumText}>📱 46 00 00 00</Text>
            </View>

            <Text style={styles.modalStep}>2. Entrez les détails ci-dessous</Text>

            <TextInput
              style={styles.input}
              placeholder="Montant (MRU)"
              keyboardType="numeric"
              value={montant}
              onChangeText={setMontant}
              placeholderTextColor={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="Référence Bankily (ex: BKL-XXXXXX)"
              value={reference}
              onChangeText={setReference}
              placeholderTextColor={COLORS.gray}
            />

            <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
              <Ionicons name={photo ? 'checkmark-circle' : 'camera-outline'} size={20} color={photo ? COLORS.success : COLORS.primary} />
              <Text style={[styles.photoBtnText, photo && { color: COLORS.success }]}>
                {photo ? 'Capture sélectionnée ✓' : 'Joindre capture d\'écran Bankily'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={submitRecharge}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Envoyer la demande</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30, alignItems: 'center' },
  headerLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 8 },
  balanceAmt: { fontSize: 42, fontWeight: '800', color: '#fff' },
  balanceCur: { fontSize: 18, fontWeight: '600' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { marginTop: 12, fontSize: 14, color: COLORS.gray },

  txCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  txIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  txDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  txDate: { fontSize: 11, color: COLORS.gray, marginTop: 3 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontWeight: '800' },
  txStatut: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  txStatutText: { fontSize: 10, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalStep: { fontSize: 13, color: COLORS.gray, marginBottom: 8, marginTop: 12 },
  bankiNum: { backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', marginBottom: 8 },
  bankiNumText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A', marginBottom: 12 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16 },
  photoBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: RADIUS.xl, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
