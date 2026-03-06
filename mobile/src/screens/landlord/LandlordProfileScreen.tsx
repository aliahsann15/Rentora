import { useCallback, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { Image, StyleSheet, Text, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { SubScreenHeader } from '../../components/layout/SubScreenHeader'
import { useAppAlert } from '../../hooks/useAppAlert'
import { ROUTES } from '../../navigation/routes'
import { LandlordSettingsStackScreenProps } from '../../navigation/types'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = LandlordSettingsStackScreenProps<'LandlordProfile'>

type ProfilePayload = {
  fullName?: string
  email?: string
  company?: string
  companyAddress?: string
  profileImage?: string
}

export const LandlordProfileScreen = ({ navigation }: Props) => {
  const { showToast } = useAppAlert()
  const [profile, setProfile] = useState<ProfilePayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get<{ profile: ProfilePayload }>('/auth/profile')
      setProfile(response.data.profile)
    } catch {
      showToast({ type: 'error', message: 'Failed to load profile' })
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useFocusEffect(
    useCallback(() => {
      void loadProfile()
    }, [loadProfile])
  )

  const fullName = profile?.fullName || '—'
  const email = profile?.email || '—'
  const company = profile?.company || '—'
  const companyAddress = profile?.companyAddress || '—'
  const profileImage = profile?.profileImage?.trim()

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
        <View style={styles.detailRow}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{fullName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Company</Text>
          <Text style={styles.value}>{company}</Text>
        </View>

        <View style={[styles.detailRow, styles.detailRowLast]}>
          <Text style={styles.label}>Company Address</Text>
          <Text style={styles.value}>{companyAddress}</Text>
        </View>

      </View>

      <AppButton
        title={isLoading ? 'Loading...' : 'Edit Profile'}
        onPress={() => navigation.navigate(ROUTES.EDIT_LANDLORD_PROFILE)}
        disabled={isLoading}
      />

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
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.xs
  },
  detailRowLast: {
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
