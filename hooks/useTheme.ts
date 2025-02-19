import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = useMemo(
    () => ({
      primary: '#8B5CF6', // Purple main color
      secondary: '#EC4899', // Pink accent
      background: isDark ? '#1A1A1A' : '#F5F3FF', // Light purple background
      card: isDark ? '#2A2A2A' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#4B5563',
      border: isDark ? '#404040' : '#E9ECEF',
      notification: '#EC4899',
      error: '#EF4444',
      success: '#10B981',
    }),
    [isDark]
  );

  return { colors, isDark };
};