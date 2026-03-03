import { useState } from 'react'
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

        <AppButton title='Login' onPress={onSubmit} loading={loading} />

        <Pressable onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}>
          <Text style={styles.link}>Forgot Password</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate(ROUTES.REGISTER)}>
          <Text style={styles.link}>Register</Text>
        </Pressable>
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
  link: {
    color: colors.primary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_500Medium'
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
