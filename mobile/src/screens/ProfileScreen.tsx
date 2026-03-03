import { StyleSheet, Text, View } from 'react-native'
import { AppButton } from '../components/AppButton'
import { ScreenContainer } from '../components/ScreenContainer'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { logout } from '../slices/authSlice'
import { colors, radius, spacing, typography } from '../utils/theme'

interface ProfileScreenProps {
  role: 'LANDLORD' | 'TENANT' | 'VENDOR'
}

export const ProfileScreen = ({ role }: ProfileScreenProps) => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const getRoleDisplayName = () => {
    switch (role) {
      case 'LANDLORD':
        return 'Property Manager'
      case 'TENANT':
        return 'Tenant'
      case 'VENDOR':
        return 'Service Provider'
      default:
        return role
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Account Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{getRoleDisplayName()}</Text>
        </View>

        <AppButton title='Sign Out' onPress={() => dispatch(logout())} variant='secondary' />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  heading: {
    fontSize: typography.headingM,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
    gap: spacing.xs
  },
  label: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium'
  },
  value: {
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  }
})
