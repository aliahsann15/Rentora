import { StyleSheet, Text, View } from 'react-native'
import { statusColors, colors, radius, spacing, typography } from '../utils/theme'

interface StatusBadgeProps {
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <View style={[styles.container, { backgroundColor: statusColors[status] }]}> 
      <Text style={styles.label}>{status.replace('_', ' ')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm
  },
  label: {
    color: colors.surface,
    fontSize: typography.caption,
    fontFamily: 'Inter_600SemiBold'
  }
})
