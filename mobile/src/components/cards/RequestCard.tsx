import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Badge } from '../common/Badge'
import { colors, radius, spacing, typography } from '../../utils/theme'

interface RequestCardProps {
  title: string
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
  subtitle?: string
  onPress?: () => void
}

export const RequestCard = ({ title, status, subtitle, onPress }: RequestCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        <Badge label={status.replace('_', ' ')} status={status} />
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    alignItems: 'center',
    gap: spacing.sm
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.bodyL,
    fontFamily: 'Inter_600SemiBold'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
