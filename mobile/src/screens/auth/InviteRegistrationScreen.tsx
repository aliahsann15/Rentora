import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, TextInput, View } from 'react-native'
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

    runValidation()
  }, [dispatch, token])

  const onSubmit = () => {
    if (!name || !password) {
      return
    }

    dispatch(registerFromInvite({ token, name, password }))
  }

  return (
    <ScreenContainer>
      <View style={styles.formCard}>
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

        <TextInput
          value={password}
          onChangeText={(value) => {
            setPassword(value)
            dispatch(clearAuthError())
          }}
          placeholder='Password'
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton title='Complete Registration' onPress={onSubmit} loading={loading} />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  title: {
    fontSize: typography.headingM,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  subtitle: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular'
  },
  metaCard: {
    borderWidth: 1,
    borderColor: colors.divider,
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
    backgroundColor: colors.surface
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
