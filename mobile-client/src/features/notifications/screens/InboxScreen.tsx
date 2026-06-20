import React, { useCallback, useState } from 'react';
import { Button, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { decideNotification, listNotifications, NotificationItem } from '../api/notifications';
import { useNotificationNavigation } from '../hooks/usePushRegistration';

export function InboxScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  useNotificationNavigation(navigation);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      setItems(await listNotifications('PENDING'));
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [])
  );

  const onDecide = async (id: string, decision: 'ACCEPT' | 'REJECT') => {
    await decideNotification(id, decision);
    await load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="Logout" onPress={() => logout()} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => navigation.navigate('NotificationDetail', { id: item.id })}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>{item.body}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <Button title="Accept" onPress={() => onDecide(item.id, 'ACCEPT')} />
              <Button title="Reject" color="#b00020" onPress={() => onDecide(item.id, 'REJECT')} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pending notifications</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 12, alignItems: 'flex-end' },
  card: { padding: 16, borderBottomWidth: 1, borderColor: '#eee', gap: 8 },
  title: { fontWeight: '600', marginBottom: 4 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  empty: { padding: 24, textAlign: 'center', color: '#666' },
});
