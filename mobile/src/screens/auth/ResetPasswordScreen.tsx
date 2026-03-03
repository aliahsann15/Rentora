import { useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearAuthError, clearAuthInfoMessage, resetPassword } from '../../slices/authSlice'
import { AuthStackParamList } from '../../navigation/types'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>

export const ResetPasswordScreen = ({ route, navigation }: Props) => {
  const dispatch = useAppDispatch()
  const { loading, error, infoMessage } = useAppSelector((state) => state.auth)

  const [token, setToken] = useState(route.params?.token || '')
  const [password, setPassword] = useState('')

  const onSubmit = async () => {
    if (!token || !password) {
      return
    }

    const action = await dispatch(resetPassword({ token, password }))
    if (resetPassword.fulfilled.match(action)) {
      navigation.navigate('Login')
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.formCard}>
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

        <TextInput
          value={password}
          onChangeText={(value) => {
            setPassword(value)
            dispatch(clearAuthError())
            dispatch(clearAuthInfoMessage())
          }}
          placeholder='New Password'
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}

        <AppButton title='Update Password' onPress={onSubmit} loading={loading} />
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
