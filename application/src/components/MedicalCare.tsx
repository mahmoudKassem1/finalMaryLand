import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Linking,
  SafeAreaView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';

const logo = require('../../assets/logo.png');
const MEDICAL_TEAM_NUMBER = '+201030520476';

interface MedicalCareProps {
  visible: boolean;
  onClose: () => void;
}

export default function MedicalCare({ visible, onClose }: MedicalCareProps) {
  const { isRTL, t } = useLanguage();
  const handleCall = () => {
    Linking.openURL(`tel:${MEDICAL_TEAM_NUMBER}`).catch(() => 
      Alert.alert(t('profile.error'), t('profile.unableDialer'))
    );
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${MEDICAL_TEAM_NUMBER}`).catch(() => 
      Alert.alert(t('profile.error'), t('profile.installWhatsApp'))
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}>
            <Ionicons name="close" size={28} color={Colors.ink || '#333'} />
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="home-outline" size={32} color="#E02424" />
            </View>
            
            <Text style={isRTL ? styles.titleAr : styles.titleEn}>{t('profile.medicalCare')}</Text>

            <View style={styles.divider} />

            <Text style={isRTL ? styles.description : styles.descriptionEn}>
              {t('profile.medicalCareDescription')}
            </Text>

            <View style={styles.actions}>
              <Pressable style={({ pressed }) => [styles.button, styles.whatsappBtn, pressed && { opacity: 0.9 }]} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={19} color="#FFF" />
                <Text style={styles.buttonText} numberOfLines={1}>WhatsApp</Text>
              </Pressable>

              <Pressable style={({ pressed }) => [styles.button, styles.callBtn, pressed && { opacity: 0.9 }]} onPress={handleCall}>
                <Ionicons name="call" size={22} color="#FFF" />
                <Text style={styles.buttonText} numberOfLines={1}>{t('profile.call')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  logo: {
    width: 350,
    height: 210,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  titleAr: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleEn: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#E02424',
    borderRadius: 2,
    marginVertical: 20,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2D3748',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionEn: {
    fontSize: 13,
    lineHeight: 20,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54, // Fixed height ensures both buttons are physically identical 
    paddingHorizontal: 12, // Added inner padding
    borderRadius: 14,
    gap: 2,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  callBtn: {
    backgroundColor: '#E02424',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});