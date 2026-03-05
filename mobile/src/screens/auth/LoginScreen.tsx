import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
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
    <ScreenContainer>
      <View style={styles.formCard}>
        <Text style={styles.title}>Rentora</Text>
        <Text style={styles.subtitle}>Access your property workspace</Text>

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

        <Pressable onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}>
          <Text style={styles.link}>Forgot Password</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton title='Login' onPress={onSubmit} loading={loading} />

        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>Don't have an account?</Text>
          <Pressable onPress={() => navigation.navigate(ROUTES.REGISTER)}>
            <Text style={styles.registerLink}>Register</Text>
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
    fontSize: typography.headingL,
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
  link: {
    marginTop: -spacing.xs,
    color: colors.primary,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  registerLink: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium'
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  registerPrompt: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular'
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
