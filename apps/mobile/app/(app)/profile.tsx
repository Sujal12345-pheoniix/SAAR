import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setLoggingOut(true);
            try {
              await logout();
              // AuthGuard will redirect to (auth) automatically
            } finally {
              setLoggingOut(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar placeholder */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user?.displayName
                ? user.displayName.charAt(0).toUpperCase()
                : user?.email?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          {user?.displayName ? (
            <Text style={styles.displayName}>{user.displayName}</Text>
          ) : null}
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>

        {/* Info rows */}
        <View style={styles.card}>
          <InfoRow label="User ID" value={user?.id ?? '—'} />
          <View style={styles.divider} />
          <InfoRow
            label="Member since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            }
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
          activeOpacity={0.8}
          onPress={handleLogout}
          disabled={loggingOut || isLoading}
        >
          {loggingOut ? (
            <ActivityIndicator color="#fca5a5" />
          ) : (
            <Text style={styles.logoutText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
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
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
  },
  header: { paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#f1f5f9' },
  avatarContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4338ca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#fff' },
  displayName: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  email: { fontSize: 14, color: '#64748b' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  rowLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  rowValue: { color: '#f1f5f9', fontSize: 14, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#334155' },
  logoutButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#7f1d1d',
  },
  buttonDisabled: { opacity: 0.5 },
  logoutText: { color: '#fca5a5', fontSize: 15, fontWeight: '700' },
});
