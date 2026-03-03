import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing, typography } from '../../utils/theme'

interface HeaderProps {
  title: string
  subtitle?: string
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.headingL,
    fontFamily: 'Inter_700Bold'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_400Regular'
  }
})
