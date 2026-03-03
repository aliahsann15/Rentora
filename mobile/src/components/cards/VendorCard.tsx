import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../utils/theme'

interface VendorCardProps {
  name: string
  specialty?: string
  rating?: number
  onPress?: () => void
}

export const VendorCard = ({ name, specialty, rating, onPress }: VendorCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{specialty || 'General'}</Text>
        {typeof rating === 'number' ? <Text style={styles.meta}>⭐ {rating.toFixed(1)}</Text> : null}
      </View>
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
  name: {
    color: colors.textPrimary,
    fontSize: typography.bodyL,
    fontFamily: 'Inter_600SemiBold'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
