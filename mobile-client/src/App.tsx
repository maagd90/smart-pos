import React from 'react';
import { SafeAreaView, Text, View, StyleSheet } from 'react-native';

/**
 * Root application component for the Store Management mobile client.
 *
 * Milestone 1: Displays a skeleton landing screen.
 * Inventory manager and store manager flows are implemented after
 * the core domain services are complete.
 */
export function App(): React.ReactElement {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Store Management Mobile</Text>
        <Text style={styles.subtitle}>Milestone 1 — Skeleton</Text>
        <Text style={styles.body}>
          Inventory manager and store manager flows will be implemented after
          core services are built.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, fontWeight: '500', opacity: 0.7 },
  body: { fontSize: 14, lineHeight: 20 },
});
