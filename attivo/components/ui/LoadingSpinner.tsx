import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large' | number;
}

export function LoadingSpinner({ size = 'large' }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.lime} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
