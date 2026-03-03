import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, radius, spacing, typography } from '../../utils/theme'

interface PropertyCardProps {
  name: string
  address?: string
  onPress?: () => void
}

export const PropertyCard = ({ name, address, onPress }: PropertyCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.name}>{name}</Text>
      {address ? <Text style={styles.address}>{address}</Text> : null}
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
  address: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
