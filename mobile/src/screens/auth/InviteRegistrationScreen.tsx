import { useEffect, useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, registerFromInvite, validateInvite } from '../../slices/authSlice'
import { AuthStackParamList } from '../../navigation/types'
import { colors, radius, shadows, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'InviteRegistration'>

type InviteMeta = {
  email: string
  role: 'TENANT' | 'VENDOR'
  organizationId: string
}

export const InviteRegistrationScreen = ({ route }: Props) => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [inviteMeta, setInviteMeta] = useState<InviteMeta | null>(null)

  const token = route.params.token
  const organizationName = route.params.organizationName?.trim()

  useEffect(() => {
    const runValidation = async () => {
      const action = await dispatch(validateInvite(token))
      if (validateInvite.fulfilled.match(action)) {
        setInviteMeta({
          email: action.payload.email,
          role: action.payload.role,
          organizationId: action.payload.organizationId
        })
      }
    }

    void runValidation()
  }, [dispatch, token])

  const heading = useMemo(() => {
    return organizationName ? `Join ${organizationName}` : 'Join your organization'
  }, [organizationName])

  const dashboardCopy = useMemo(() => {
    if (inviteMeta?.role === 'VENDOR') {
      return 'gain access to your vendor dashboard.'
    }

    return 'gain access to your tenant dashboard.'
  }, [inviteMeta?.role])

  const onSubmit = () => {
    if (!name || !password) {
      setFormError('Please complete your name and password.')
      return
    }

    if (!termsAccepted) {
      setFormError('Please accept the Terms of Service and Privacy Policy.')
      return
    }

    setFormError(null)
    dispatch(registerFromInvite({ token, name, password, phone: phone.trim() || undefined }))
  }

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.subtitle}>
            Complete your profile to accept the invitation and {dashboardCopy}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accept Invitation</Text>
          <Text style={styles.cardSubtitle}>Setting up your account takes less than a minute.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Invited Email</Text>
            <View style={[styles.inputShell, styles.readOnlyShell]}>
              <Ionicons name='mail-outline' size={20} color={colors.textMuted} style={styles.inputIcon} />
              <Text style={styles.readOnlyValue}>{inviteMeta?.email || 'Validating invitation...'}</Text>
            </View>
            <Text style={styles.helperText}>This address was specified in your invitation.</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputShell}>
              <Ionicons name='person-outline' size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value)
                  setFormError(null)
                  dispatch(clearAuthError())
                }}
                placeholder='Alex Johnson'
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputShell}>
              <Ionicons name='call-outline' size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={phone}
                onChangeText={(value) => {
                  setPhone(value)
                  setFormError(null)
                  dispatch(clearAuthError())
                }}
                placeholder='(555) 000-0000'
                placeholderTextColor={colors.textMuted}
                keyboardType='phone-pad'
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Create Password</Text>
            <View style={styles.inputShell}>
              <Ionicons name='lock-closed-outline' size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value)
                  setFormError(null)
                  dispatch(clearAuthError())
                }}
                placeholder='Min. 8 characters'
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
              />
              <Pressable
                accessibilityRole='button'
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((current) => !current)}
                hitSlop={10}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.benefitsCard}>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIconWrap, styles.benefitBlue]}>
                <Ionicons name='shield-checkmark-outline' size={18} color={colors.primary} />
              </View>
              <View style={styles.benefitTextWrap}>
                <Text style={styles.benefitTitle}>Secure Access</Text>
                <Text style={styles.benefitSubtitle}>Encrypted profile setup</Text>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.benefitIconWrap, styles.benefitPeach]}>
                <Ionicons name='wallet-outline' size={18} color={colors.tertiary} />
              </View>
              <View style={styles.benefitTextWrap}>
                <Text style={styles.benefitTitle}>Role-Based Access</Text>
                <Text style={styles.benefitSubtitle}>Tenant and vendor dashboard permissions</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.termsRow}
            onPress={() => setTermsAccepted((current) => !current)}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: termsAccepted }}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
              {termsAccepted ? <Ionicons name='checkmark' size={14} color={colors.surface} /> : null}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
              {' '}of Rentora.
            </Text>
          </Pressable>

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton title='Accept Invite' onPress={onSubmit} loading={loading} style={styles.actionButton} />
        </View>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    padding: spacing.sm
  },
  shell: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg
  },
  headerBlock: {
    gap: spacing.sm
  },
  title: {
    fontSize: 30,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    lineHeight: 34
  },
  subtitle: {
    fontSize: typography.bodyL,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    maxWidth: 420
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card
  },
  cardTitle: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  cardSubtitle: {
    fontSize: typography.bodyL,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginTop: -spacing.xs
  },
  fieldGroup: {
    gap: 6
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_700Bold'
  },
  inputShell: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 58,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md
  },
  readOnlyShell: {
    backgroundColor: colors.primarySoft
  },
  inputIcon: {
    marginRight: spacing.sm
  },
  input: {
    flex: 1,
    minHeight: 58,
    color: colors.textPrimary,
    fontSize: typography.bodyL,
    fontFamily: 'Inter_400Regular'
  },
  passwordInput: {
    paddingRight: spacing.sm
  },
  readOnlyValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.bodyL,
    fontFamily: 'Inter_500Medium'
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic'
  },
  benefitsCard: {
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#DEE1FF'
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  benefitIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  benefitBlue: {
    backgroundColor: '#DDE2FF'
  },
  benefitPeach: {
    backgroundColor: '#FFE3D1'
  },
  benefitTextWrap: {
    flex: 1,
    gap: 2
  },
  benefitTitle: {
    color: colors.textPrimary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_700Bold'
  },
  benefitSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_400Regular'
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: 2
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: colors.surface
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  termsText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20
  },
  termsLink: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold'
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  actionButton: {
    height: 56,
    borderRadius: 12,
    marginTop: spacing.xs
  }
})
