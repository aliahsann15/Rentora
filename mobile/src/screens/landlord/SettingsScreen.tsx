import { StyleSheet, Text, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { logout } from '../../slices/authSlice'
import { colors, radius, spacing, typography } from '../../utils/theme'

export const SettingsScreen = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  return (
    <ScreenContainer>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Profile</Text>
        <Text style={styles.value}>{user?.name || '—'}</Text>
        <Text style={styles.value}>{user?.email || '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Subscription Plan</Text>
        <Text style={styles.value}>Trial / Active</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Billing Info</Text>
        <Text style={styles.value}>Managed in subscription settings</Text>
      </View>

      <AppButton title='Logout' variant='danger' onPress={() => dispatch(logout())} />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.headingL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs
  },
  section: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold'
  },
  value: {
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  }
})
