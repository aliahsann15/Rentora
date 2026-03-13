import { useState } from 'react'
import type { AxiosError } from 'axios'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { AppButton } from '../components/AppButton'
import { ScreenContainer } from '../components/ScreenContainer'
import { SubScreenHeader } from '../components/layout/SubScreenHeader'
import { useAppAlert } from '../hooks/useAppAlert'
import { api } from '../services/api'
import { colors, radius, spacing, typography } from '../utils/theme'

interface ChangePasswordScreenProps {
	onSuccess?: () => void
}

interface ApiErrorBody {
	message?: string
}

export const ChangePasswordScreen = ({ onSuccess }: ChangePasswordScreenProps) => {
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
			onSuccess?.()
		} catch (error: unknown) {
			const message = (error as AxiosError<ApiErrorBody>)?.response?.data?.message
			showToast({ type: 'error', message: message || 'Failed to update password' })
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<ScreenContainer>
			<SubScreenHeader title='Change Password' />

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
						<Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
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
						<Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
					</Pressable>
				</View>

				<AppButton title='Reset' onPress={onResetPress} loading={isSubmitting} />
			</View>
		</ScreenContainer>
	)
}

const styles = StyleSheet.create({
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
