import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to end your active session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setLoggingOut(true);
            try {
              await logout();
            } finally {
              setLoggingOut(false);
            }
          })();
        },
      },
    ]);
  }

  function handleExportData() {
    Alert.alert('Export Data', 'A secure archive of your behavior events and reflections is being prepared.');
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Permanently erase your account, memories, and behavior history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Permanently', style: 'destructive', onPress: () => Alert.alert('Request Submitted') },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>SETTINGS & PRIVACY</Text>
          <Text style={styles.title}>Profile.</Text>
        </View>

        {/* Avatar block */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user?.displayName
                ? user.displayName.charAt(0).toUpperCase()
                : user?.email?.charAt(0).toUpperCase() ?? 'S'}
            </Text>
          </View>
          {user?.displayName ? (
            <Text style={styles.displayName}>{user.displayName}</Text>
          ) : null}
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>

        {/* Identity & Account Card */}
        <View style={styles.card}>
          <InfoRow label="Timezone" value={user?.timezone ?? 'UTC (Natural Time)'} />
          <View style={styles.divider} />
          <InfoRow
            label="Member Since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Active Member'
            }
          />
        </View>

        {/* Privacy & Memory Architecture (Section 18 Part 4C & Section 23 Part 4D) */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Privacy & Companion Memory</Text>
          <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
            <Text style={styles.actionRowText}>Export Personal Behavior Archive</Text>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <Text style={[styles.actionRowText, { color: '#9B2C2C' }]}>Erase Account & Memory</Text>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
          activeOpacity={0.8}
          onPress={handleLogout}
          disabled={loggingOut || isLoading}
        >
          {loggingOut ? (
            <ActivityIndicator color="#0F1115" />
          ) : (
            <Text style={styles.logoutText}>Sign Out of SAAR</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

type InfoRowProps = { label: string; value: string };

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F5' },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,17,21,0.06)',
    paddingBottom: 10,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#868E96',
    letterSpacing: 1,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0F1115' },
  avatarContainer: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0F1115',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 26, fontWeight: '700', color: '#FAF8F5' },
  displayName: { fontSize: 18, fontWeight: '700', color: '#0F1115' },
  email: { fontSize: 13, color: '#868E96' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 17, 21, 0.08)',
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#868E96',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  rowLabel: { color: '#495057', fontSize: 13, fontWeight: '500' },
  rowValue: { color: '#0F1115', fontSize: 13, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  actionRowText: { fontSize: 13, fontWeight: '500', color: '#0F1115' },
  arrowText: { fontSize: 14, color: '#868E96' },
  divider: { height: 1, backgroundColor: 'rgba(15, 17, 21, 0.06)' },
  logoutButton: {
    backgroundColor: '#F5F2EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 17, 21, 0.1)',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  logoutText: { color: '#9B2C2C', fontSize: 14, fontWeight: '600' },
});
