import { Snackbar } from 'react-native-paper';
import { colors, typography } from '../../constants/theme';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, visible, onDismiss, duration = 3000 }: ToastProps) {
  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      theme={{
        colors: {
          onSurface: colors.white,
          inverseSurface: colors.card,
        },
      }}
    >
      {message}
    </Snackbar>
  );
}
