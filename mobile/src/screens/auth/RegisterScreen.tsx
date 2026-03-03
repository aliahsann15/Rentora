import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, register } from '../../slices/authSlice'
import { colors, radius, spacing, typography } from '../../utils/theme'

export const RegisterScreen = () => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = () => {
    if (!name || !organizationName || !email || !password) {
      return
    }

    dispatch(register({ name, organizationName, email, password }))
  }

  return (
    <ScreenContainer>
      <View style={styles.formCard}>
        <Text style={styles.title}>Create landlord workspace</Text>
        <Text style={styles.subtitle}>Creates your organization and starts trial</Text>

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
          value={email}
          onChangeText={(value) => {
            setEmail(value)
            dispatch(clearAuthError())
          }}
          placeholder='Email'
          placeholderTextColor={colors.textMuted}
          autoCapitalize='none'
          keyboardType='email-address'
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

        <TextInput
          value={organizationName}
          onChangeText={(value) => {
            setOrganizationName(value)
            dispatch(clearAuthError())
          }}
          placeholder='Organization Name'
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton title='Create Account' onPress={onSubmit} loading={loading} />
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
