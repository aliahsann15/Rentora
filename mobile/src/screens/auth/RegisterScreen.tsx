import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
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
    if (!name || !organizationName || !email || !password || loading) {
      return
    }

    dispatch(register({ name, organizationName, email, password }))
  }

  return (
    <ScreenContainer scrollable={false} style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.brandRow}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoIcon} resizeMode='contain' />
        </View>

        <View style={styles.centerContent}>
          <View style={styles.formBlock}>
            <Text style={styles.title}>Create account</Text>
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

          <Pressable
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={onSubmit}
            accessibilityRole='button'
            disabled={loading}
          >
            <Text style={styles.createButtonLabel}>{loading ? 'Creating...' : 'Create account'}</Text>
          </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account?</Text>
              <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
                <Text style={styles.link}>Login</Text>
              </Pressable>
            </View>
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
    alignItems: 'center',
    marginBottom: -spacing.xl
  },
  logoIcon: {
    width: 148,
    height: 44,
    marginBottom: -spacing.xl
  },
  formBlock: {
    gap: spacing.md
  },
  title: {
    fontSize: typography.headingL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: -spacing.sm
  },
  subtitle: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center'
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
  createButton: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledButton: {
    opacity: 0.6
  },
  createButtonLabel: {
    color: colors.surface,
    fontFamily: 'Inter_700Bold',
    fontSize: typography.bodyL
  },
  link: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold'
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  loginPrompt: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular'
  }
})
