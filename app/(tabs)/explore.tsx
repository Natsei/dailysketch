import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import type { Database } from '@/types/supabase';

type Challenge = Database['public']['Tables']['challenges']['Row'];
type Submission = Database['public']['Tables']['submissions']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = async () => {
    try {
      const { data, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(10);

      if (challengesError) throw challengesError;
      setChallenges(data);
      if (data.length > 0 && !selectedChallenge) {
        setSelectedChallenge(data[0]);
      }
    } catch (err) {
      setError('Failed to load challenges');
      console.error('Error fetching challenges:', err);
    }
  };

  const fetchSubmissions = async (challengeId: string) => {
    try {
      const { data, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(data as Submission[]);
    } catch (err) {
      setError('Failed to load submissions');
      console.error('Error fetching submissions:', err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchChallenges();
      setLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedChallenge) {
      fetchSubmissions(selectedChallenge.id);
    }
  }, [selectedChallenge]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchChallenges(),
      selectedChallenge && fetchSubmissions(selectedChallenge.id),
    ]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
        style={styles.gradient}
      />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.challengesScroll}
        contentContainerStyle={styles.challengesContainer}>
        {challenges.map((challenge) => (
          <Pressable
            key={challenge.id}
            style={[
              styles.challengeCard,
              {
                backgroundColor: colors.card,
                borderColor: selectedChallenge?.id === challenge.id ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => setSelectedChallenge(challenge)}>
            <Text
              style={[
                styles.challengeTitle,
                { color: colors.text },
              ]}>
              {challenge.title}
            </Text>
            <Text
              style={[
                styles.challengeDate,
                { color: colors.text + '80' },
              ]}>
              {new Date(challenge.start_date).toLocaleDateString()}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.submissionsScroll}
        contentContainerStyle={styles.submissionsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          submissions.map((submission) => (
            <View
              key={submission.id}
              style={[
                styles.submissionCard,
                { backgroundColor: colors.card },
              ]}>
              <View style={styles.submissionHeader}>
                <Image
                  source={{
                    uri: submission.profiles.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        submission.profiles.username
                      )}`,
                  }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View>
                  <Text style={[styles.username, { color: colors.text }]}>
                    {submission.profiles.display_name || submission.profiles.username}
                  </Text>
                  <Text style={[styles.date, { color: colors.text + '80' }]}>
                    {new Date(submission.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <Image
                source={{ uri: submission.image_url }}
                style={styles.submissionImage}
                contentFit="cover"
              />
              
              {submission.description && (
                <Text style={[styles.description, { color: colors.text }]}>
                  {submission.description}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
  challengesScroll: {
    maxHeight: 100,
  },
  challengesContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  challengeCard: {
    padding: 16,
    borderRadius: 16,
    minWidth: 200,
    borderWidth: 2,
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
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeDate: {
    fontSize: 14,
  },
  submissionsScroll: {
    flex: 1,
  },
  submissionsContainer: {
    padding: 20,
    gap: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submissionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
        elevation: 4,
      },
    }),
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
  },
  submissionImage: {
    width: '100%',
    height: 300,
  },
  description: {
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
  },
});