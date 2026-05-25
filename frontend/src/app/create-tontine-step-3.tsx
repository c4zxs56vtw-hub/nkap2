import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';
import { createInviteFromTontineName } from '../services/qrInviteService';

export default function CreateTontineStep3Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, contentMaxWidth, hPad } = useResponsive();
  const [creating, setCreating] = useState(false);

  const params = useLocalSearchParams<{
    type: string;
    amount: string;
    frequency: string;
    rule: string;
    order: string;
    memberCount: string;
    tontineName: string;
    description: string;
    maxWaitDays: string;
    requiresRib: string;
    totalPool: string;
  }>();

  const bottomInset = Math.max(insets.bottom, 12);

  const amountPerPart = parseInt(params.amount ?? '0', 10);
  const memberCount = parseInt(params.memberCount ?? '0', 10);
  const totalPool = parseInt(params.totalPool ?? '0', 10);
  const requiresRib = params.requiresRib === '1';

  const formatAmount = (n: number) =>
    n > 0 ? n.toLocaleString('fr-FR') + ' FCFA' : '—';

  const labelFrequency = params.frequency === 'mensuel' ? 'Mensuel' : 'Hebdomadaire';
  const labelType = params.type === 'privee' ? 'Privée 🔒' : 'Publique 🌍';
  const labelRule = params.rule === 'amende' ? 'Amende immédiate (10%)' : 'Retenue à la source';
  const labelOrder =
    params.order === 'admin'
      ? "Défini par l'Admin"
      : params.order === 'aleatoire'
      ? 'Aléatoire'
      : "Système d'enchères";

  const handleCreate = async () => {
    setCreating(true);
    try {
      // TODO : appel API backend Django — POST /api/tontines/create/
      await new Promise((resolve) => setTimeout(resolve, 1500)); // simulation
      const invite = await createInviteFromTontineName(
        params.tontineName ?? 'Ma tontine',
        params.type === 'privee'
      );
      Alert.alert(
        'Tontine créée 🎉',
        `"${params.tontineName}" a été créée. Partagez le QR d’invitation pour que les membres rejoignent.`,
        [
          {
            text: 'Voir le QR d’invitation',
            onPress: () =>
              router.replace({
                pathname: '/tontine-invite-qr',
                params: { id: invite.tontineId },
              } as never),
          },
          { text: 'Dashboard', onPress: () => router.replace('/dashboard' as never) },
        ]
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la tontine. Veuillez réessayer.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View
            style={[
              styles.topBarInner,
              isWeb && { maxWidth: contentMaxWidth ?? 700, alignSelf: 'center', width: '100%' },
            ]}
          >
            <View style={styles.topBarLeft}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.85}
                onPress={() => safeGoBack(router, '/create-tontine-step-2')}
              >
                <Ionicons name="arrow-back" size={24} color="#00687a" />
              </TouchableOpacity>
              <Text style={styles.brand}>Nkap</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AP</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb
              ? styles.scrollContentWeb
              : { paddingBottom: 120 + bottomInset },
          ]}
        >
          <View
            style={[
              styles.container,
              isWeb && styles.containerWeb,
              isWeb && contentMaxWidth ? { width: contentMaxWidth } : undefined,
              { paddingHorizontal: isWeb ? 40 : hPad },
            ]}
          >
            {/* Progress */}
            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Créer une Tontine</Text>
                <Text style={styles.progressStep}>Étape 3 sur 3</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '100%' }]} />
              </View>
            </View>

            {/* Titre section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Récapitulatif</Text>
              <Text style={styles.sectionSubtitle}>
                Vérifiez tous les paramètres avant de créer votre tontine.
              </Text>
            </View>

            {/* Carte nom */}
            <View style={styles.nameCard}>
              <View style={styles.nameIconWrap}>
                <MaterialCommunityIcons name="account-group" size={28} color="#10B981" />
              </View>
              <View style={styles.nameTextWrap}>
                <Text style={styles.nameTitle}>{params.tontineName || '—'}</Text>
                {params.description ? (
                  <Text style={styles.nameDesc}>{params.description}</Text>
                ) : null}
              </View>
            </View>

            {/* Grille récap */}
            <View style={styles.recapGrid}>
              {[
                { icon: 'tag-outline', label: 'Type', value: labelType, color: '#06b6d4' },
                { icon: 'account-multiple-outline', label: 'Membres', value: `${memberCount} membres`, color: '#10B981' },
                { icon: 'cash-multiple', label: 'Part / membre', value: formatAmount(amountPerPart), color: '#00687a' },
                { icon: 'calendar-clock', label: 'Fréquence', value: labelFrequency, color: '#6d797d' },
                { icon: 'alert-circle-outline', label: 'Règle retard', value: labelRule, color: '#b4136d' },
                { icon: 'sort-numeric-ascending', label: 'Ordre de passage', value: labelOrder, color: '#00687a' },
                { icon: 'clock-outline', label: 'Jours de grâce', value: `${params.maxWaitDays} jour(s)`, color: '#6d797d' },
              ].map((item) => (
                <View key={item.label} style={styles.recapItem}>
                  <View style={[styles.recapIcon, { backgroundColor: item.color + '1a' }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <View style={styles.recapItemText}>
                    <Text style={styles.recapLabel}>{item.label}</Text>
                    <Text style={styles.recapValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Cagnotte totale */}
            <View style={styles.poolCard}>
              <View style={styles.poolCardGlowTop} />
              <View style={styles.poolCardGlowBottom} />
              <Text style={styles.poolCardLabel}>Cagnotte par tour</Text>
              <View style={styles.poolCardRow}>
                <Text style={styles.poolCardAmount}>{totalPool.toLocaleString('fr-FR')}</Text>
                <Text style={styles.poolCardCurrency}>FCFA</Text>
              </View>
              <View style={styles.poolCardDetails}>
                <Text style={styles.poolCardDetail}>
                  Commission Nkap : {formatAmount(Math.round(totalPool * 0.01))}
                </Text>
                <Text style={styles.poolCardDetailGreen}>
                  Versement net : {formatAmount(Math.round(totalPool * 0.99))}
                </Text>
              </View>
            </View>

            {/* Alerte RIB */}
            {requiresRib && (
              <View style={styles.ribAlert}>
                <MaterialCommunityIcons name="bank-outline" size={20} color="#00687a" />
                <View style={styles.ribAlertText}>
                  <Text style={styles.ribAlertTitle}>RIB CEMAC obligatoire</Text>
                  <Text style={styles.ribAlertSubtitle}>
                    La cagnotte dépasse 2 000 000 FCFA. Le Mobile Money est désactivé pour cette
                    tontine. Chaque membre devra fournir un RIB valide de 23 chiffres.
                  </Text>
                </View>
              </View>
            )}

            {/* Alerte tontine publique */}
            {params.type === 'publique' && (
              <View style={styles.publicAlert}>
                <MaterialCommunityIcons name="shield-star-outline" size={20} color="#b4136d" />
                <View style={styles.ribAlertText}>
                  <Text style={styles.publicAlertTitle}>Rangs verrouillés actifs</Text>
                  <Text style={styles.publicAlertSubtitle}>
                    Les 3 premiers tours sont réservés aux profils avec un trust_score &gt; 90.
                    Les nouveaux membres seront positionnés en fin de liste.
                  </Text>
                </View>
              </View>
            )}

            {/* Engagement légal */}
            <View style={styles.legalBox}>
              <MaterialCommunityIcons name="file-document-outline" size={16} color="#6d797d" />
              <Text style={styles.legalText}>
                En créant cette tontine, vous acceptez les Conditions Générales d&apos;Utilisation
                de Nkap et vous engagez à respecter les règles définies ci-dessus.
              </Text>
            </View>

            {/* Bouton web inline */}
            {isWeb && (
              <TouchableOpacity
                style={[styles.primaryButton, creating && styles.primaryButtonLoading]}
                activeOpacity={0.9}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Créer la tontine</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Footer fixe — mobile only */}
        {!isWeb && (
          <View style={[styles.footer, { paddingBottom: bottomInset }]}>
            <TouchableOpacity
              style={[styles.primaryButton, creating && styles.primaryButtonLoading]}
              activeOpacity={0.9}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Créer la tontine</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e9eb',
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5fafc',
  },
  brand: { color: '#00687a', fontSize: 24, fontWeight: '800' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#00424f', fontSize: 12, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  scrollContentWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: '100%',
  },
  container: { paddingTop: 24, paddingBottom: 24, width: '100%' },
  containerWeb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    paddingVertical: 40,
  },
  progressBlock: { marginBottom: 24 },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  progressTitle: { flex: 1, color: '#171d1e', fontSize: 24, fontWeight: '600' },
  progressStep: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#eef3f6',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#10B981' },
  sectionBlock: { marginBottom: 20 },
  sectionTitle: { color: '#171d1e', fontSize: 20, fontWeight: '600' },
  sectionSubtitle: { marginTop: 4, color: '#3d494c', fontSize: 13, lineHeight: 20 },
  nameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f5fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 16,
    marginBottom: 20,
  },
  nameIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTextWrap: { flex: 1 },
  nameTitle: { color: '#171d1e', fontSize: 18, fontWeight: '800' },
  nameDesc: { marginTop: 4, color: '#3d494c', fontSize: 13, lineHeight: 18 },
  recapGrid: {
    backgroundColor: '#f5fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    overflow: 'hidden',
    marginBottom: 20,
  },
  recapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#dee3e6',
    gap: 12,
  },
  recapIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapItemText: { flex: 1 },
  recapLabel: { color: '#6d797d', fontSize: 11, fontWeight: '600' },
  recapValue: { marginTop: 2, color: '#171d1e', fontSize: 14, fontWeight: '700' },
  poolCard: {
    borderRadius: 16,
    backgroundColor: '#10B981',
    padding: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  poolCardGlowTop: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -16,
    top: -12,
  },
  poolCardGlowBottom: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(2,6,23,0.06)',
    left: -8,
    bottom: -8,
  },
  poolCardLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  poolCardRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  poolCardAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  poolCardCurrency: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  poolCardDetails: { marginTop: 12, flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  poolCardDetail: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  poolCardDetailGreen: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  ribAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#dff7fb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#06b6d4',
    padding: 14,
    marginBottom: 16,
  },
  ribAlertText: { flex: 1 },
  ribAlertTitle: { color: '#00424f', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  ribAlertSubtitle: { color: '#00687a', fontSize: 12, lineHeight: 18 },
  publicAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FDF2F8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    padding: 14,
    marginBottom: 16,
  },
  publicAlertTitle: { color: '#b4136d', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  publicAlertSubtitle: { color: '#BE185D', fontSize: 12, lineHeight: 18 },
  legalBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  legalText: { flex: 1, color: '#6d797d', fontSize: 11, lineHeight: 16 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e3e9eb',
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryButtonLoading: { backgroundColor: '#34D399' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
