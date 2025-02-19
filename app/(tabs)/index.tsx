import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Challenge = Database['public']['Tables']['challenges']['Row'];
type Submission = Database['public']['Tables']['submissions']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  like_count: number;
  comment_count: number;
  has_liked: boolean;
};

export default function TodayScreen() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayChallenge = async () => {
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const { data: challenges, error: challengeError } = await supabase
        .from('challenges')
        .select()
        .eq('start_date', today)
        .limit(1);

      if (challengeError) {
        console.error('Error fetching challenge:', challengeError);
        setError('Failed to load today\'s challenge');
        return;
      }

      if (challenges && challenges.length > 0) {
        setChallenge(challenges[0]);
      } else {
        setChallenge(null);
      }
    } catch (error) {
      console.error('Error in fetchTodayChallenge:', error);
      setError('An unexpected error occurred');
    }
  };

  const fetchSubmissions = async () => {
    if (!challenge) return;

    try {
      setError(null);
      const { data, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          ),
          like_count:likes(count),
          comment_count:comments(count),
          has_liked:likes!inner(id)
        `)
        .eq('challenge_id', challenge.id)
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        setError('Failed to load submissions');
        return;
      }

      setSubmissions(data as Submission[]);
    } catch (error) {
      console.error('Error in fetchSubmissions:', error);
      setError('An unexpected error occurred');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTodayChallenge(), fetchSubmissions()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTodayChallenge();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (challenge) {
      fetchSubmissions();
    }
  }, [challenge]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading today's challenge...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {challenge ? (
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
          <Link href="/create" asChild>
            <Pressable style={styles.participateButton}>
              <Text style={styles.participateButtonText}>Participate Now</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <View style={styles.noChallenge}>
          <Text style={styles.noChallengeText}>
            No challenge available for today
          </Text>
        </View>
      )}

      <View style={styles.submissionsHeader}>
        <Text style={styles.submissionsTitle}>Today's Submissions</Text>
        <Text style={styles.submissionsCount}>
          {submissions.length} submissions
        </Text>
      </View>

      {submissions.map((submission) => (
        <View key={submission.id} style={styles.submissionCard}>
          <View style={styles.submissionHeader}>
            <Image
              source={{ uri: submission.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.profiles.username)}` }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>
                {submission.profiles.display_name || submission.profiles.username}
              </Text>
              <Text style={styles.username}>@{submission.profiles.username}</Text>
            </View>
          </View>

          <Image
            source={{ uri: submission.image_url }}
            style={styles.submissionImage}
            contentFit="cover"
            transition={500}
          />

          {submission.description && (
            <Text style={styles.submissionDescription}>
              {submission.description}
            </Text>
          )}

          <View style={styles.interactionBar}>
            <Pressable style={styles.interactionButton}>
              <Ionicons
                name={submission.has_liked ? 'heart' : 'heart-outline'}
                size={24}
                color={submission.has_liked ? '#FF6B6B' : '#666'}
              />
              <Text style={styles.interactionCount}>
                {submission.like_count}
              </Text>
            </Pressable>

            <Pressable style={styles.interactionButton}>
              <Ionicons name="chatbubble-outline" size={24} color="#666" />
              <Text style={styles.interactionCount}>
                {submission.comment_count}
              </Text>
            </Pressable>

            <Pressable style={styles.interactionButton}>
              <Ionicons name="share-outline" size={24} color="#666" />
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  participateButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  participateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noChallenge: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
  },
  noChallengeText: {
    fontSize: 16,
    color: '#666',
  },
  submissionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  submissionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  submissionsCount: {
    fontSize: 14,
    color: '#666',
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  userInfo: {
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  submissionImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  submissionDescription: {
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  interactionBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  interactionCount: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
});