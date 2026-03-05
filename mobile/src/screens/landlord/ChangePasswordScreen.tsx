import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppAlert } from '../../hooks/useAppAlert'
import { LandlordSettingsStackScreenProps } from '../../navigation/types'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = LandlordSettingsStackScreenProps<'ChangePassword'>

export const ChangePasswordScreen = ({ navigation }: Props) => {
  const { showToast } = useAppAlert()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onResetPress = async () => {
    if (!newPassword || !confirmPassword) {
      showToast({ type: 'error', message: 'Both password fields are required' })
      return
    }

    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match' })
      return
    }

    try {
      setIsSubmitting(true)
      await api.post('/auth/change-password', { password: newPassword })
      showToast({ type: 'success', message: 'Password updated successfully' })
      navigation.goBack()
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast({ type: 'error', message: message || 'Failed to update password' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Change Password</Text>

      <View style={styles.formCard}>
        <View style={styles.inputRow}>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder='New Password'
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showNewPassword}
            style={styles.passwordInput}
            autoCapitalize='none'
          />
          <Pressable onPress={() => setShowNewPassword((prev) => !prev)} hitSlop={8}>
            <Ionicons
              name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder='Confirm Password'
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showConfirmPassword}
            style={styles.passwordInput}
            autoCapitalize='none'
          />
          <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} hitSlop={8}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <AppButton title='Reset' onPress={onResetPress} loading={isSubmitting} />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.headingL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md
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
  }
})
