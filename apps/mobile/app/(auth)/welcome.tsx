import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Branding */}
        <View style={styles.brandingBlock}>
          <Text style={styles.logo}>SAAR</Text>
          <Text style={styles.tagline}>
            A calm, intelligent companion for becoming the person you want to become.
          </Text>
        </View>

        {/* CTA buttons */}
        <View style={styles.buttonBlock}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/onboarding')}
          >
            <Text style={styles.primaryButtonText}>Begin Guided Setup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>SAAR · Personal Growth Intelligence</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  brandingBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    fontSize: 54,
    fontWeight: '800',
    color: '#0F1115',
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  buttonBlock: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#0F1115',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FAF8F5',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.18)',
  },
  secondaryButtonText: {
    color: '#0F1115',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#868E96',
    fontSize: 11,
    marginTop: 24,
  },
});
