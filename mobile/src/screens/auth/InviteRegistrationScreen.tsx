import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, registerFromInvite, validateInvite } from '../../slices/authSlice'
import { AuthStackParamList } from '../../navigation/types'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'InviteRegistration'>

export const InviteRegistrationScreen = ({ route }: Props) => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inviteMeta, setInviteMeta] = useState<{
    email: string
    role: 'TENANT' | 'VENDOR'
    organizationId: string
  } | null>(null)

  const token = route.params.token

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

  const onSubmit = () => {
    if (!name || !password) {
      return
    }

    dispatch(registerFromInvite({ token, name, password }))
  }

  return (
    <ScreenContainer scrollable={false} style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.brandRow}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoIcon} resizeMode='contain' />
        </View>

        <View style={styles.centerContent}>
          <View style={styles.formBlock}>
            <Text style={styles.title}>Invite Registration</Text>
            <Text style={styles.subtitle}>Complete your tenant/vendor account setup</Text>

          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Email</Text>
            <Text style={styles.metaValue}>{inviteMeta?.email || 'Validating...'}</Text>
            <Text style={styles.metaLabel}>Role</Text>
            <Text style={styles.metaValue}>{inviteMeta?.role || 'Validating...'}</Text>
          </View>

          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value)
              dispatch(clearAuthError())
            }}
            placeholder='Name'
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <View style={styles.inputRow}>
            <TextInput
              value={password}
              onChangeText={(value) => {
                setPassword(value)
                dispatch(clearAuthError())
              }}
              placeholder='Password'
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton title='Complete Registration' onPress={onSubmit} loading={loading} style={styles.actionButton} />
          </View>
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
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: 'flex-start',
    gap: spacing.md
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center'
  },
  brandRow: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoIcon: {
    width: 148,
    height: 44
  },
  formBlock: {
    gap: spacing.md
  },
  title: {
    fontSize: typography.headingL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center'
  },
  metaCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  metaValue: {
    color: colors.textPrimary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    backgroundColor: colors.background
  },
  inputRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 48,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm
  },
  passwordInput: {
    flex: 1,
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  actionButton: {
    height: 56,
    borderRadius: radius.md
  }
})
