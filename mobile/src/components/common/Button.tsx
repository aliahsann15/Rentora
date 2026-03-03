import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style
}: ButtonProps) => {
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
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : colors.surface} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel]}>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary
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
    color: colors.primary
  }
})
