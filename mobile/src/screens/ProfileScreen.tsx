import { useCallback, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { Image, StyleSheet, Text, View } from 'react-native'
import { AppButton } from '../components/AppButton'
import { ScreenContainer } from '../components/ScreenContainer'
import { SubScreenHeader } from '../components/layout/SubScreenHeader'
import { useAppAlert } from '../hooks/useAppAlert'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { logout } from '../slices/authSlice'
import { api } from '../services/api'
import { colors, radius, spacing, typography } from '../utils/theme'

type UserRole = 'LANDLORD' | 'TENANT' | 'VENDOR'

interface ProfileScreenProps {
  role?: UserRole
  onEditPress?: () => void
}

interface ProfilePayload {
  fullName?: string
  email?: string
  profileImage?: string
  landlordName?: string
  propertyName?: string
  unitNumber?: string
  company?: string
  companyAddress?: string
}

interface ProfileResponse {
  profile: ProfilePayload
}

interface ApiErrorBody {
  message?: string
}

export const ProfileScreen = ({ role, onEditPress }: ProfileScreenProps) => {
  const dispatch = useAppDispatch()
  const { showToast } = useAppAlert()
  const user = useAppSelector((state) => state.auth.user)
  const activeRole: UserRole = role ?? user?.role ?? 'TENANT'
  const [profile, setProfile] = useState<ProfilePayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get<ProfileResponse>('/auth/profile')
      setProfile(response.data.profile)
    } catch (error: unknown) {
      const message = (error as AxiosError<ApiErrorBody>)?.response?.data?.message
      showToast({ type: 'error', message: message || 'Failed to load profile' })
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useFocusEffect(
    useCallback(() => {
      void loadProfile()
    }, [loadProfile])
  )

  const roleDisplay = useMemo(() => {
    if (activeRole === 'LANDLORD') return 'Property Manager'
    if (activeRole === 'VENDOR') return 'Service Provider'
    return 'Tenant'
  }, [activeRole])

  const fullName = profile?.fullName || user?.name || '—'
  const email = profile?.email || user?.email || '—'
  const profileImage = profile?.profileImage?.trim()
  const landlordName = profile?.landlordName || '—'
  const propertyName = profile?.propertyName || '—'
  const unitNumber = profile?.unitNumber || '—'
  const company = profile?.company || '—'
  const companyAddress = profile?.companyAddress || '—'
  const canEdit = Boolean(onEditPress) && activeRole !== 'VENDOR'

  return (
    <ScreenContainer>
      <SubScreenHeader title='Profile' />

      <View style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <Ionicons name='person-outline' size={36} color={colors.textMuted} />
          )}
        </View>
        <Text style={styles.heroName}>{fullName}</Text>
        <Text style={styles.heroEmail}>{email}</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{roleDisplay}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{fullName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        {activeRole === 'TENANT' && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Landlord</Text>
              <Text style={styles.value}>{landlordName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Property</Text>
              <Text style={styles.value}>{propertyName}</Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.label}>Unit</Text>
              <Text style={styles.value}>{unitNumber}</Text>
            </View>
          </>
        )}

        {activeRole === 'LANDLORD' && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Company</Text>
              <Text style={styles.value}>{company}</Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.label}>Company Address</Text>
              <Text style={styles.value}>{companyAddress}</Text>
            </View>
          </>
        )}

        {activeRole === 'VENDOR' && <View style={styles.rowLast} />}
      </View>

      {canEdit ? <AppButton title={isLoading ? 'Loading...' : 'Edit Profile'} onPress={onEditPress} disabled={isLoading} /> : null}

      <AppButton title='Sign Out' onPress={() => dispatch(logout())} variant='secondary' />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  heroName: {
    fontSize: typography.headingM,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  heroEmail: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular'
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: spacing.sm,
    gap: spacing.xs
  },
  rowLast: {
    borderBottomWidth: 0
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
