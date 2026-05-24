import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, login } from '../../slices/authSlice'
import { AuthStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export const LoginScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = () => {
    if (!email || !password) {
      return
    }

    dispatch(login({ email, password }))
  }

  return (
    <ScreenContainer scrollable={false} style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.brandRow}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoIcon} resizeMode='contain' />
        </View>

        <View style={styles.centerContent}>
          <View style={styles.formBlock}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Enter your credentials to access your properties</Text>

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

            <AppButton title='Login' onPress={onSubmit} loading={loading} style={styles.loginButton} />

            <Pressable onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <View style={{ width: spacing.sm }} />
              <Text style={{ color: colors.textMuted, fontSize: typography.caption }}>or continue with</Text>
              <View style={{ width: spacing.sm }} />
              <View style={styles.dividerLine} />
            </View>

            <View style={{ gap: spacing.sm, flexDirection: 'row' }}>
              {Platform.OS === 'ios' && (
                <Pressable style={styles.registerButton} onPress={() => navigation.navigate(ROUTES.REGISTER)} accessibilityRole='button' >
                  <Ionicons name='logo-apple' size={20} color={colors.surface} />
                  <Text style={styles.registerButtonLabel}>Apple</Text>
                </Pressable>
              )}
              <Pressable style={styles.registerButton} onPress={() => navigation.navigate(ROUTES.REGISTER)} accessibilityRole='button' >
                <Ionicons name='logo-google' size={20} color={colors.surface} />
                <Text style={styles.registerButtonLabel}>Google</Text>
              </Pressable>
            </View>

          </View>

          <Text style={[styles.subtitle, { marginTop: spacing.lg }]}>
            Don't have an account?{' '}
            <Text
              style={[styles.link, { fontSize: typography.bodyM }]}
              onPress={() => navigation.navigate(ROUTES.REGISTER)}
              accessibilityRole='button'
            >
              Sign up
            </Text>
          </Text>

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
    fontSize: typography.headingXL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: -spacing.md
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
    paddingHorizontal: spacing.md,
    gap: spacing.sm
  },
  passwordInput: {
    flex: 1,
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  link: {
    marginTop: -spacing.sm,
    color: colors.primary,
    fontSize: typography.caption,
    fontFamily: 'Inter_600SemiBold'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.border,
    flex: 1,
    maxWidth: 120
  },
  loginButton: {
    height: 56,
    borderRadius: radius.md
  },
  registerButton: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundDark,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  registerButtonLabel: {
    color: colors.surface,
    fontFamily: 'Inter_700Bold',
    fontSize: typography.bodyL
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
