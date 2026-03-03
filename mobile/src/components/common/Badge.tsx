import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, statusColors, typography } from '../../utils/theme'

interface BadgeProps {
  label: string
  status?: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
}

export const Badge = ({ label, status = 'NEW' }: BadgeProps) => {
  return (
    <View style={[styles.container, { backgroundColor: statusColors[status] || colors.primary }]}> 
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  label: {
    color: colors.surface,
    fontSize: typography.caption,
    fontFamily: 'Inter_600SemiBold'
  }
})
