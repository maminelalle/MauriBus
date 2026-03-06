import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { walletAPI } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const METHODS = [
  { id: 'WALLET', icon: 'wallet', label: 'Wallet MauriBus', desc: 'Payer depuis votre solde' },
  { id: 'BANKILY', icon: 'phone-portrait', label: 'Bankily', desc: 'Paiement mobile Bankily' },
  { id: 'ESPECES', icon: 'cash', label: 'Espèces', desc: 'Payer en espèces au chauffeur' },
];

export default function PaymentScreen({ route, navigation }) {
  const { line } = route.params || {};
  const { citizen } = useAuth();
  const [method, setMethod] = useState('WALLET');
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [ticketId, setTicketId] = useState(null);

  const tarif = parseFloat(line?.tarif_base || 0);
  const balance = parseFloat(citizen?.wallet_balance || 0);

  const handlePay = async () => {
    if (method === 'WALLET' && balance < tarif) {
      Alert.alert(
        'Solde insuffisant',
        `Votre solde (${balance.toFixed(0)} MRU) est insuffisant pour ce trajet (${tarif.toFixed(0)} MRU).`,
        [
          { text: 'Recharger', onPress: () => navigation.navigate('Wallet') },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
      return;
    }
    if (method === 'ESPECES') {
      Alert.alert('Paiement en espèces', 'Veuillez remettre le montant exact au chauffeur lors de la montée.');
      return;
    }
    if (method === 'BANKILY') {
      Alert.alert('Bankily', 'Envoyez le montant au 46 00 00 00 puis rechargez votre wallet depuis l\'écran Wallet.');
      return;
    }
    setLoading(true);
    try {
      const res = await walletAPI.pay({
        ligne_id: line?.id,
        montant: tarif,
        methode_paiement: method,
      });
      setTicketId(res.data.ticket_id);
      setPaid(true);
    } catch (e) {
      Alert.alert('Erreur', e?.response?.data?.detail || 'Erreur lors du paiement.');
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        </View>
        <Text style={styles.successTitle}>Paiement réussi !</Text>
        <Text style={styles.successSub}>Votre trajet a été payé avec succès.</Text>
        {line && (
          <View style={styles.successCard}>
            <View style={[styles.lineCode, { backgroundColor: line.couleur || COLORS.primary }]}>
              <Text style={styles.lineCodeText}>{line.code}</Text>
            </View>
            <View>
              <Text style={styles.successLineName}>{line.nom}</Text>
              <Text style={styles.successLineRoute}>{line.terminus_depart} → {line.terminus_arrivee}</Text>
            </View>
          </View>
        )}
        <Text style={styles.successAmount}>{tarif.toFixed(0)} MRU débité</Text>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => ticketId
            ? navigation.replace('Ticket', { ticketId })
            : navigation.navigate('Accueil')}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.homeBtnText}>Voir mon ticket QR</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Accueil')}>
          <Text style={styles.histLink}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Trip summary */}
        {line && (
          <View style={[styles.tripCard, SHADOW.medium]}>
            <Text style={styles.tripLabel}>Trajet sélectionné</Text>
            <View style={styles.tripRow}>
              <View style={[styles.lineCode, { backgroundColor: line.couleur || COLORS.primary }]}>
                <Text style={styles.lineCodeText}>{line.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripName}>{line.nom}</Text>
                <Text style={styles.tripRoute}>{line.terminus_depart} → {line.terminus_arrivee}</Text>
              </View>
              <Text style={styles.tripAmount}>{tarif.toFixed(0)} MRU</Text>
            </View>
          </View>
        )}

        {/* Wallet balance */}
        <View style={[styles.balanceCard, SHADOW.small]}>
          <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>Solde Wallet</Text>
            <Text style={styles.balanceVal}>{balance.toLocaleString('fr-FR')} MRU</Text>
          </View>
          {balance < tarif && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>Insuffisant</Text>
            </View>
          )}
        </View>

        {/* Method selector */}
        <Text style={styles.sectionTitle}>Méthode de paiement</Text>
        {METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodCard, method === m.id && styles.methodCardActive, SHADOW.small]}
            onPress={() => setMethod(m.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.methodIcon, { backgroundColor: method === m.id ? COLORS.primary + '15' : COLORS.background }]}>
              <Ionicons name={m.icon} size={22} color={method === m.id ? COLORS.primary : COLORS.gray} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, method === m.id && { color: COLORS.primary }]}>{m.label}</Text>
              <Text style={styles.methodDesc}>{m.desc}</Text>
            </View>
            <View style={[styles.radio, method === m.id && styles.radioActive]}>
              {method === m.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Summary */}
        <View style={[styles.summaryCard, SHADOW.small]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tarif trajet</Text>
            <Text style={styles.summaryVal}>{tarif.toFixed(0)} MRU</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Méthode</Text>
            <Text style={styles.summaryVal}>{METHODS.find(m => m.id === method)?.label}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>{tarif.toFixed(0)} MRU</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pay button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.6 }]}
          onPress={handlePay}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.payBtnText}>Confirmer le paiement — {tarif.toFixed(0)} MRU</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  scroll: { padding: 16, paddingBottom: 30 },

  tripCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: 18, marginBottom: 14 },
  tripLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineCode: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lineCodeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  tripName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  tripRoute: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  tripAmount: { fontSize: 22, fontWeight: '800', color: '#fff' },

  balanceCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  balanceLabel: { fontSize: 12, color: COLORS.gray },
  balanceVal: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  alertBadge: { backgroundColor: COLORS.error + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  alertBadgeText: { fontSize: 11, color: COLORS.error, fontWeight: '700' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  methodCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  methodCardActive: { borderColor: COLORS.primary },
  methodIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  methodDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  summaryCard: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16, marginTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 13, color: COLORS.gray },
  summaryVal: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  totalVal: { fontSize: 18, fontWeight: '800', color: COLORS.primary },

  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  payBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: RADIUS.xl },
  payBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Success
  successContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  successSub: { fontSize: 14, color: COLORS.gray, marginBottom: 24 },
  successCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.background, borderRadius: RADIUS.xl, padding: 16, width: '100%', marginBottom: 12 },
  successLineName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  successLineRoute: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  successAmount: { fontSize: 16, fontWeight: '700', color: COLORS.success, marginBottom: 32 },
  homeBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: RADIUS.xl, marginBottom: 12 },
  homeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  histLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
