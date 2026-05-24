import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, clearAuthInfoMessage, forgotPassword } from '../../slices/authSlice'
import { AuthStackParamList } from '../../navigation/types'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>

export const ForgotPasswordScreen = (_props: Props) => {
  const dispatch = useAppDispatch()
  const { loading, error, infoMessage } = useAppSelector((state) => state.auth)
  const [email, setEmail] = useState('')

  const onSubmit = async () => {
    if (!email) {
      return
    }

    await dispatch(forgotPassword({ email }))
  }

  return (
    <ScreenContainer scrollable={false} style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.brandRow}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoIcon} resizeMode='contain' />
        </View>

        <View style={styles.centerContent}>
          <View style={styles.formBlock}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email to reset your password</Text>

          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value)
              dispatch(clearAuthError())
              dispatch(clearAuthInfoMessage())
            }}
            placeholder='Email'
            placeholderTextColor={colors.textMuted}
            autoCapitalize='none'
            keyboardType='email-address'
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}

            <AppButton title='Send Reset Link' onPress={onSubmit} loading={loading} style={styles.actionButton} />
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
    marginBottom: -spacing.xxl
  },
  logoIcon: {
    width: 148,
    height: 44,
    marginBottom: -spacing.xxl
  },
  formBlock: {
    gap: spacing.md
  },
  title: {
    fontSize: typography.headingXL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: -spacing.md,
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
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    marginBottom: spacing.sm
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
