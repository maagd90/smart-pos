import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { decideNotification, getNotification, NotificationItem } from '../api/notifications';

type Params = { NotificationDetail: { id: string } };

export function NotificationDetailScreen() {
  const route = useRoute<RouteProp<Params, 'NotificationDetail'>>();
  const [item, setItem] = useState<NotificationItem | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getNotification(route.params.id).then(setItem).catch(() => setMessage('Failed to load'));
  }, [route.params.id]);

  const onDecide = async (decision: 'ACCEPT' | 'REJECT') => {
    const res = await decideNotification(route.params.id, decision);
    setMessage(res.message);
    const updated = await getNotification(route.params.id);
    setItem(updated);
  };

  if (!item) {
    return <View style={styles.container}><Text>{message || 'Loading...'}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.body}</Text>
      <Text>Status: {item.status}</Text>
      {message ? <Text>{message}</Text> : null}
      {item.status === 'PENDING' ? (
        <View style={styles.actions}>
          <Button title="Accept" onPress={() => onDecide('ACCEPT')} />
          <Button title="Reject" color="#b00020" onPress={() => onDecide('REJECT')} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
});
