import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../utils/theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string | null
}

export const Input = ({ label, error, style, ...props }: InputProps) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
