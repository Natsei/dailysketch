import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Submission = Database['public']['Tables']['submissions']['Row'] & {
  challenges: Database['public']['Tables']['challenges']['Row'];
};

type Stats = {
  submissions_count: number;
  likes_received: number;
  comments_received: number;
};

type AuthState = 'signIn' | 'signUp';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>('signIn');
  
  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) return;

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          challenges (
            id,
            title,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(data as Submission[]);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions');
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      // Get submissions count
      const { count: submissions_count } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get likes received
      const { count: likes_received } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get comments received
      const { count: comments_received } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        submissions_count: submissions_count || 0,
        likes_received: likes_received || 0,
        comments_received: comments_received || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Fetch user data after successful sign in
      await Promise.all([
        fetchProfile(),
        fetchSubmissions(),
        fetchStats(),
      ]);
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Switch to sign in view after successful registration
      setAuthState('signIn');
      setError('Registration successful! Please sign in.');
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setProfile(null);
      setSubmissions([]);
      setStats(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchSubmissions(),
        fetchStats(),
      ]);
      setLoading(false);
    };
    loadInitialData();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await loadInitialData();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSubmissions([]);
        setStats(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(),
      fetchSubmissions(),
      fetchStats(),
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

  if (!profile) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.authContainer}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
          style={styles.gradient}
        />
        
        <View style={[styles.authCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.authTitle, { color: colors.text }]}>
            {authState === 'signIn' ? 'Welcome Back!' : 'Create Account'}
          </Text>
          
          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          )}

          {authState === 'signUp' && (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Username"
                placeholderTextColor={colors.text + '80'}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Display Name"
                placeholderTextColor={colors.text + '80'}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </>
          )}

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.text + '80'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.text + '80'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={authState === 'signIn' ? handleSignIn : handleSignUp}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {authState === 'signIn' ? 'Sign In' : 'Sign Up'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setError(null);
              setAuthState(authState === 'signIn' ? 'signUp' : 'signIn');
            }}
          >
            <Text style={[styles.authToggleText, { color: colors.primary }]}>
              {authState === 'signIn' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
        <Image
          source={{
            uri: profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile.username
              )}`,
          }}
          style={styles.avatar}
          contentFit="cover"
        />
        <Text style={[styles.displayName, { color: colors.text }]}>
          {profile.display_name || profile.username}
        </Text>
        <Text style={[styles.username, { color: colors.text + '80' }]}>
          @{profile.username}
        </Text>
        {profile.bio && (
          <Text style={[styles.bio, { color: colors.text }]}>{profile.bio}</Text>
        )}
        
        <Pressable
          style={[styles.signOutButton, { backgroundColor: colors.error }]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="brush" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats?.submissions_count || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
            Drawings
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="heart" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats?.likes_received || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
            Likes
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="chatbubble" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats?.comments_received || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
            Comments
          </Text>
        </View>
      </View>

      <View style={styles.galleryContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Drawings
        </Text>
        {submissions.map((submission) => (
          <View
            key={submission.id}
            style={[styles.submissionCard, { backgroundColor: colors.card }]}>
            <Image
              source={{ uri: submission.image_url }}
              style={styles.submissionImage}
              contentFit="cover"
            />
            <View style={styles.submissionInfo}>
              <Text style={[styles.challengeTitle, { color: colors.text }]}>
                {submission.challenges.title}
              </Text>
              <Text style={[styles.submissionDate, { color: colors.text + '80' }]}>
                {new Date(submission.created_at).toLocaleDateString()}
              </Text>
            </View>
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
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    padding: 20,
    borderRadius: 20,
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
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  authButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  authToggleText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  signOutButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
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
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  galleryContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  submissionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
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
  submissionImage: {
    width: '100%',
    height: 300,
  },
  submissionInfo: {
    padding: 16,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});