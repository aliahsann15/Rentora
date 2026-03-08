import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native'
import { colors, radius, spacing, typography } from '../utils/theme'

type Variant = 'primary' | 'secondary' | 'danger'

interface AppButtonProps {
  title: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style
}: AppButtonProps) => {
  const isDisabled = disabled || loading

  return (
    <Pressable
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.backgroundDark
  },
  danger: {
    backgroundColor: colors.danger
  },
  disabled: {
    opacity: 0.6
  },
  label: {
    fontSize: typography.bodyM,
    fontFamily: 'Inter_500Medium'
  },
  primaryLabel: {
    color: colors.surface
  },
  secondaryLabel: {
    color: colors.surface
  }
})
