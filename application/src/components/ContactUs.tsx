import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { Colors } from '../constants/Colors';

const CONTACTS = {
  whatsapp: ['+201000686866', '+201000076890', '+201033520476'],
  landline: ['03 5408605', '03 5499475'],
  facebook: 'https://www.facebook.com/share/1GUYMi3dKK/?mibextid=wwXIfr',
  instagram: 'https://www.instagram.com/marylandpharmacy2020?igsh=MWZhNm51eHdqYWptcg==',
  coordinates: '31.2668,29.9895',
};

export default function ContactUs() {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const isEnglish = language === 'en';

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        isEnglish ? 'Unable to open link' : 'تعذر فتح الرابط',
        isEnglish ? 'Please try again or use another contact method.' : 'يرجى المحاولة مرة أخرى أو استخدام وسيلة تواصل أخرى.'
      );
    }
  };

  const openDirections = () => {
    const url =
      Platform.OS === 'ios'
        ? `maps://maps.apple.com/?q=${CONTACTS.coordinates}`
        : `https://www.google.com/maps/search/?api=1&query=${CONTACTS.coordinates}`;
    void openLink(url);
  };

  const openWhatsApp = (phone: string) => {
    void openLink(`https://wa.me/${phone.replace(/\D/g, '')}`);
  };

  const openPhone = (phone: string) => {
    void openLink(`tel:${phone.replace(/\s/g, '')}`);
  };

  const sectionTitle = (icon: React.ComponentProps<typeof Ionicons>['name'], title: string) => (
    <View style={[styles.sectionHeading, isRTL && styles.rowReverse]}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={[styles.sectionHeadingText, isRTL && styles.textRTL]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isEnglish ? 'Go back' : 'رجوع'}
          onPress={() => router.back()}
          style={[styles.backButton, isRTL && styles.rowReverse]}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={21} color={Colors.ink} />
          <Text style={styles.backText}>{isEnglish ? 'Back' : 'رجوع'}</Text>
        </Pressable>

        <View style={styles.intro}>
          <Text style={[styles.title, isRTL && styles.textRTL]}>
            {isEnglish ? 'Contact ' : 'تواصل '}
            <Text style={styles.titleAccent}>{isEnglish ? 'Us' : 'معنا'}</Text>
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
            {isEnglish
              ? 'We are here to help you 24/7. Reach out through any of our channels.'
              : 'نحن هنا لمساعدتك على مدار الساعة. تواصل معنا عبر أي من قنواتنا.'}
          </Text>
        </View>

        <View style={styles.panel}>
          {sectionTitle('chatbubble-ellipses-outline', isEnglish ? 'WhatsApp' : 'واتساب')}
          <View style={styles.contactList}>
            {CONTACTS.whatsapp.map((phone) => (
              <Pressable
                key={phone}
                accessibilityRole="link"
                onPress={() => openWhatsApp(phone)}
                style={({ pressed }) => [styles.whatsappRow, pressed && styles.pressed]}
              >
                <Text style={styles.phoneText}>{phone}</Text>
                <Ionicons name="send" size={17} color={Colors.whatsapp} />
              </Pressable>
            ))}
          </View>

          {sectionTitle('call-outline', isEnglish ? 'Landline' : 'الخط الأرضي')}
          <View style={styles.landlineRow}>
            {CONTACTS.landline.map((phone) => (
              <Pressable
                key={phone}
                accessibilityRole="link"
                onPress={() => openPhone(phone)}
                style={({ pressed }) => [styles.landlineButton, pressed && styles.pressed]}
              >
                <Text style={styles.phoneText}>{phone}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.socialRow}>
            <Pressable
              accessibilityRole="link"
              onPress={() => void openLink(CONTACTS.facebook)}
              style={({ pressed }) => [styles.socialButton, styles.facebookButton, pressed && styles.pressed]}
            >
              <Ionicons name="logo-facebook" size={19} color="#1877F2" />
              <Text style={[styles.socialText, { color: '#1877F2' }]}>Facebook</Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => void openLink(CONTACTS.instagram)}
              style={({ pressed }) => [styles.socialButton, styles.instagramButton, pressed && styles.pressed]}
            >
              <Ionicons name="logo-instagram" size={19} color="#C13584" />
              <Text style={[styles.socialText, { color: '#C13584' }]}>Instagram</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.locationPanel}>
          <View style={styles.locationInfo}>
            <View style={styles.locationTitleBlock}>
              {sectionTitle('location-outline', isEnglish ? 'Location' : 'الموقع')}
              <Text style={[styles.locationName, isRTL && styles.textRTL]}>
                {isEnglish ? 'Alexandria, Egypt' : 'الإسكندرية، مصر'}
              </Text>
            </View>
            <View style={styles.hoursBadge}>
              <Ionicons name="time-outline" size={14} color={Colors.whatsapp} />
              <Text style={styles.hoursText}>{isEnglish ? '24 Hours' : '٢٤ ساعة'}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={openDirections}
            style={({ pressed }) => [styles.directionsButton, pressed && styles.pressed]}
          >
            <Ionicons name="navigate-outline" size={19} color={Colors.surface} />
            <Text style={styles.directionsText}>
              {isEnglish ? 'Get Directions' : 'الحصول على الاتجاهات'}
            </Text>
          </Pressable>

          <View style={styles.mapFrame}>
            <WebView
              accessibilityLabel={isEnglish ? 'Maryland Pharmacy location map' : 'خريطة موقع صيدلية Maryland'}
              source={{
                html: `<!DOCTYPE html>
                  <html lang="${language}">
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
                      <style>
                        html, body, iframe { width: 100%; height: 100%; margin: 0; padding: 0; border: 0; }
                      </style>
                    </head>
                    <body>
                      <iframe
                        title="Maryland Pharmacy location"
                        src="https://maps.google.com/maps?q=${encodeURIComponent(`${CONTACTS.coordinates} Maryland Pharmacy`)}&z=16&output=embed"
                        loading="lazy"
                        allowfullscreen
                        referrerpolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </body>
                  </html>`,
              }}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['https://*']}
              style={styles.map}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.pageBase },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 20 },
  backButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8 },
  backText: { color: Colors.ink, fontSize: 15, fontWeight: '700' },
  intro: { alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 4 },
  title: { color: Colors.ink, fontSize: 34, fontWeight: '900', textTransform: 'uppercase' },
  titleAccent: { color: Colors.primary },
  subtitle: { maxWidth: 420, color: Colors.secondary, fontSize: 14, fontWeight: '600', lineHeight: 21, textAlign: 'center' },
  panel: { padding: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: 16, gap: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  sectionHeadingText: { color: Colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  contactList: { gap: 9 },
  whatsappRow: { minHeight: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneText: { color: Colors.ink, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  landlineRow: { flexDirection: 'row', gap: 10 },
  landlineButton: { minHeight: 50, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 12, backgroundColor: '#F8FAFC' },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  socialButton: { minHeight: 48, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1 },
  facebookButton: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  instagramButton: { backgroundColor: '#FDF2F8', borderColor: '#FCE7F3' },
  socialText: { fontSize: 14, fontWeight: '800' },
  locationPanel: { overflow: 'hidden', backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderSubtle },
  locationInfo: { padding: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  locationTitleBlock: { flex: 1, gap: 7 },
  locationName: { color: Colors.ink, fontSize: 18, fontWeight: '900' },
  hoursBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.whatsappBg },
  hoursText: { color: Colors.whatsapp, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  directionsButton: { minHeight: 48, marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 12, backgroundColor: Colors.primary },
  directionsText: { color: Colors.surface, fontSize: 14, fontWeight: '800' },
  mapFrame: { height: 300, backgroundColor: '#E2E8F0' },
  map: { flex: 1 },
  rowReverse: { flexDirection: 'row-reverse' },
  textRTL: { textAlign: 'right' },
  pressed: { opacity: 0.78 },
});
