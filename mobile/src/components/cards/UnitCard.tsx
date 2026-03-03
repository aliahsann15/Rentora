import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../utils/theme'

interface UnitCardProps {
  unitNumber: string
  details?: string
  onPress?: () => void
}

export const UnitCard = ({ unitNumber, details, onPress }: UnitCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.label}>Unit</Text>
        <Text style={styles.value}>{unitNumber}</Text>
      </View>
      {details ? <Text style={styles.details}>{details}</Text> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.bodyL,
    fontFamily: 'Inter_600SemiBold'
  },
  details: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
