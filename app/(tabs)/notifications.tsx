import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Notification = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'challenge';
  title: string;
  message: string;
  image_url?: string;
  created_at: string;
  read: boolean;
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Simulated notifications for demo
  const fetchNotifications = async () => {
    // In a real app, this would fetch from a notifications table
    const demoNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        title: 'New Like',
        message: 'Sarah liked your drawing',
        image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
        created_at: new Date().toISOString(),
        read: false,
      },
      {
        id: '2',
        type: 'comment',
        title: 'New Comment',
        message: 'Mike commented on your drawing: "This is amazing!"',
        image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read: true,
      },
      {
        id: '3',
        type: 'challenge',
        title: 'New Challenge',
        message: 'Today\'s challenge: Urban Sketching',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        read: false,
      },
    ];

    setNotifications(demoNotifications);
  };

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={24} color={colors.secondary} />;
      case 'comment':
        return <Ionicons name="chatbubble" size={24} color={colors.primary} />;
      case 'follow':
        return <Ionicons name="person-add" size={24} color={colors.primary} />;
      case 'challenge':
        return <Ionicons name="trophy" size={24} color="#FFB800" />;
      default:
        return <Ionicons name="notifications" size={24} color={colors.primary} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      </View>

      <View style={styles.notificationsContainer}>
        {notifications.map((notification) => (
          <View
            key={notification.id}
            style={[
              styles.notificationCard,
              {
                backgroundColor: colors.card,
                opacity: notification.read ? 0.8 : 1,
              },
            ]}>
            <View style={styles.notificationIcon}>
              {getNotificationIcon(notification.type)}
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                {notification.title}
              </Text>
              <Text
                style={[
                  styles.notificationMessage,
                  { color: colors.text + '80' },
                ]}>
                {notification.message}
              </Text>
              <Text
                style={[styles.notificationTime, { color: colors.text + '60' }]}>
                {new Date(notification.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {notification.image_url && (
              <Image
                source={{ uri: notification.image_url }}
                style={styles.notificationImage}
                contentFit="cover"
              />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  notificationsContainer: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
});