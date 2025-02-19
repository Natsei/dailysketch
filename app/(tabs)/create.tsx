import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function CreateScreen() {
  const { colors } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Please sign in to submit your drawing');
      }

      const { data: challenges, error: challengeError } = await supabase
        .from('challenges')
        .select('id')
        .eq('start_date', new Date().toISOString().split('T')[0])
        .limit(1);

      if (challengeError) throw challengeError;
      if (!challenges || challenges.length === 0) {
        throw new Error('No active challenge found');
      }

      // TODO: Implement image upload to Supabase Storage
      const imageUrl = 'https://placeholder.com/image.jpg';

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          challenge_id: challenges[0].id,
          image_url: imageUrl,
          description,
        });

      if (submissionError) throw submissionError;

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Create Your Art</Text>

        <Pressable 
          style={[styles.imageContainer, { backgroundColor: colors.card }]} 
          onPress={pickImage}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={colors.primary} />
              <Text style={[styles.imagePlaceholderText, { color: colors.text }]}>
                Tap to select an image
              </Text>
            </View>
          )}
        </Pressable>

        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
          }]}
          placeholder="Add a description..."
          placeholderTextColor={colors.text + '80'}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Share Your Creation</Text>
            )}
          </LinearGradient>
        </Pressable>
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
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.12)',
      },
      default: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 8,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePlaceholderText: {
    fontSize: 16,
    marginTop: 12,
  },
  input: {
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
      },
      default: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
        elevation: 4,
      },
    }),
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});