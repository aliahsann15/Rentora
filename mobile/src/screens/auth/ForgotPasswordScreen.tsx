import { useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, clearAuthInfoMessage, forgotPassword } from '../../slices/authSlice'
import { AuthStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch()
  const { loading, error, infoMessage } = useAppSelector((state) => state.auth)
  const [email, setEmail] = useState('')

  const onSubmit = async () => {
    if (!email) {
      return
    }

    const action = await dispatch(forgotPassword({ email }))
    if (forgotPassword.fulfilled.match(action) && action.payload.resetToken) {
      navigation.navigate(ROUTES.RESET_PASSWORD, { token: action.payload.resetToken })
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.formCard}>
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

        <AppButton title='Send Reset Link' onPress={onSubmit} loading={loading} />
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
  },
  info: {
    color: colors.success,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
