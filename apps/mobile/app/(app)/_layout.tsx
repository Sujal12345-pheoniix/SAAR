import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

type TabIconProps = {
  label: string;
  focused: boolean;
};

function TabIcon({ label, focused }: TabIconProps) {
  const icons: Record<string, string> = {
    Today: '☀',
    Plan: '▦',
    Growth: '▲',
    Companion: '◉',
    Profile: '●',
  };

  return (
    <View style={styles.iconWrapper}>
      <Text style={[styles.iconSymbol, focused && styles.iconFocused]}>
        {icons[label] ?? '•'}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#226949', // SAAR Growth green
        tabBarInactiveTintColor: '#868E96', // Graphite
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon label="Today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => <TabIcon label="Plan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: 'Growth',
          tabBarIcon: ({ focused }) => <TabIcon label="Growth" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          title: 'Companion',
          tabBarIcon: ({ focused }) => <TabIcon label="Companion" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
      {/* Hidden legacy routes for deep links */}
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen name="insights" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FAF8F5',
    borderTopColor: 'rgba(15, 17, 21, 0.08)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  iconSymbol: {
    fontSize: 17,
    color: '#868E96',
  },
  iconFocused: {
    color: '#226949',
    fontWeight: 'bold',
  },
});
