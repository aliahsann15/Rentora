import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, register } from '../../slices/authSlice'
import { AuthStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

export const RegisterScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
            <Text style={styles.link}>Login</Text>
          </Pressable>
        </View>
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
  inputRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 48,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md
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
  link: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium'
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  loginPrompt: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular'
  },
})
