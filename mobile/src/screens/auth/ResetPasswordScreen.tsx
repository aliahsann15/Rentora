import { useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, clearAuthInfoMessage, resetPassword } from '../../slices/authSlice'
import { AuthStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>

export const ResetPasswordScreen = ({ route, navigation }: Props) => {
  const dispatch = useAppDispatch()
  const { loading, error, infoMessage } = useAppSelector((state) => state.auth)

  const [token, setToken] = useState(route.params?.token || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async () => {
    if (!token || !password) {
      return
    }

    const action = await dispatch(resetPassword({ token, password }))
    if (resetPassword.fulfilled.match(action)) {
      navigation.navigate(ROUTES.LOGIN)
    }
  }

  return (
    <ScreenContainer scrollable={false} style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.brandRow}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoIcon} resizeMode='contain' />
        </View>

        <View style={styles.centerContent}>
          <View style={styles.formBlock}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Set a new secure password</Text>

          <TextInput
            value={token}
            onChangeText={(value) => {
              setToken(value)
              dispatch(clearAuthError())
              dispatch(clearAuthInfoMessage())
            }}
            placeholder='Reset Token'
            placeholderTextColor={colors.textMuted}
            autoCapitalize='none'
            style={styles.input}
          />

          <View style={styles.inputRow}>
            <TextInput
              value={password}
              onChangeText={(value) => {
                setPassword(value)
                dispatch(clearAuthError())
                dispatch(clearAuthInfoMessage())
              }}
              placeholder='New Password'
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
          {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}

            <AppButton title='Update Password' onPress={onSubmit} loading={loading} style={styles.actionButton} />
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
    textAlign: 'center'
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
  info: {
    color: colors.success,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  actionButton: {
    height: 56,
    borderRadius: radius.md
  }
})
