import { useCallback, useState } from 'react'
import type { AxiosError } from 'axios'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../components/AppButton'
import { ScreenContainer } from '../components/ScreenContainer'
import { SubScreenHeader } from '../components/layout/SubScreenHeader'
import { useAppAlert } from '../hooks/useAppAlert'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { bootstrapSession } from '../slices/authSlice'
import { api } from '../services/api'
import { colors, radius, spacing, typography } from '../utils/theme'

type UserRole = 'LANDLORD' | 'TENANT' | 'VENDOR'

interface EditProfileScreenProps {
	role: UserRole
	onSaved: () => void
}

interface FormPayload {
	fullName: string
	email: string
	profileImage: string
	company: string
	companyAddress: string
}

interface ProfileResponse {
	profile?: Partial<FormPayload>
}

interface ApiErrorBody {
	message?: string
}

export const EditProfileScreen = ({ role, onSaved }: EditProfileScreenProps) => {
	const dispatch = useAppDispatch()
	const { showToast } = useAppAlert()
	const [form, setForm] = useState<FormPayload>({
		fullName: '',
		email: '',
		profileImage: '',
		company: '',
		companyAddress: ''
	})
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	const loadProfile = useCallback(async () => {
		try {
			setIsLoading(true)
			const response = await api.get<ProfileResponse>('/auth/profile')
			const profile = response.data.profile || {}
			setForm({
				fullName: profile.fullName || '',
				email: profile.email || '',
				profileImage: profile.profileImage || '',
				company: profile.company || '',
				companyAddress: profile.companyAddress || ''
			})
		} catch (error: unknown) {
			const message = (error as AxiosError<ApiErrorBody>)?.response?.data?.message
			showToast({ type: 'error', message: message || 'Failed to load profile' })
		} finally {
			setIsLoading(false)
		}
	}, [showToast])

	useFocusEffect(
		useCallback(() => {
			void loadProfile()
		}, [loadProfile])
	)

	const onSave = async () => {
		if (!form.fullName.trim() || !form.email.trim()) {
			showToast({ type: 'error', message: 'Full Name and Email are required' })
			return
		}

		try {
			setIsSaving(true)
			await api.patch('/auth/profile', {
				fullName: form.fullName,
				email: form.email,
				profileImage: form.profileImage,
				...(role === 'LANDLORD' ? { company: form.company, companyAddress: form.companyAddress } : {})
			})
			await dispatch(bootstrapSession())
			showToast({ type: 'success', message: 'Profile updated successfully' })
			onSaved()
		} catch (error: unknown) {
			const message = (error as AxiosError<ApiErrorBody>)?.response?.data?.message
			showToast({ type: 'error', message: message || 'Failed to update profile' })
		} finally {
			setIsSaving(false)
		}
	}

	const pickProfileImage = async () => {
		try {
			const imagePickerModule = await import('expo-image-picker')
			const permission = await imagePickerModule.requestMediaLibraryPermissionsAsync()
			if (!permission.granted) {
				showToast({
					type: 'error',
					message: 'Photo permission is required to select a profile image.'
				})
				return
			}

			const result = await imagePickerModule.launchImageLibraryAsync({
				mediaTypes: ['images'],
				allowsMultipleSelection: false,
				quality: 0.8
			})

			if (result.canceled || !result.assets.length) {
				return
			}

			setForm((prev) => ({ ...prev, profileImage: result.assets[0].uri }))
		} catch {
			showToast({
				type: 'error',
				message: 'Image picker is unavailable in this build. Rebuild the dev client and try again.'
			})
		}
	}

	return (
		<ScreenContainer>
			<SubScreenHeader title='Edit Profile' />

			<View style={styles.avatarCard}>
				<View style={styles.avatarWrap}>
					<Pressable style={styles.imagePickerOverlayButton} onPress={() => void pickProfileImage()}>
						<Text style={styles.imagePickerOverlayLabel}>Change</Text>
					</Pressable>
					{form.profileImage.trim() ? (
						<Image source={{ uri: form.profileImage.trim() }} style={styles.avatarImage} />
					) : (
						<Ionicons name='person-outline' size={34} color={colors.textMuted} />
					)}
				</View>
				<Text style={styles.avatarHint}>Tap Change to select profile image</Text>
			</View>

			<View style={styles.formCard}>
				<TextInput
					value={form.fullName}
					onChangeText={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
					placeholder='Full Name'
					placeholderTextColor={colors.textMuted}
					style={styles.input}
				/>
				<TextInput
					value={form.email}
					onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
					placeholder='Email'
					placeholderTextColor={colors.textMuted}
					style={[styles.input, styles.inputDisabled]}
					editable={false}
					autoCapitalize='none'
					keyboardType='email-address'
				/>
				{role === 'LANDLORD' && (
					<>
						<TextInput
							value={form.company}
							onChangeText={(value) => setForm((prev) => ({ ...prev, company: value }))}
							placeholder='Company'
							placeholderTextColor={colors.textMuted}
							style={styles.input}
						/>
						<TextInput
							value={form.companyAddress}
							onChangeText={(value) => setForm((prev) => ({ ...prev, companyAddress: value }))}
							placeholder='Company Address'
							placeholderTextColor={colors.textMuted}
							style={styles.input}
						/>
					</>
				)}
			</View>

			<AppButton title={isSaving ? 'Saving...' : 'Save Changes'} onPress={onSave} loading={isSaving} disabled={isLoading} />
		</ScreenContainer>
	)
}

const styles = StyleSheet.create({
	avatarCard: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		alignItems: 'center',
		padding: spacing.md,
		gap: spacing.sm
	},
	avatarWrap: {
		width: 84,
		height: 84,
		borderRadius: 42,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.background,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		position: 'relative'
	},
	imagePickerOverlayButton: {
		width: 100,
		position: 'absolute',
		bottom: 0,
		right: 0,
		zIndex: 10,
		elevation: 5,
		paddingHorizontal: 6,
		paddingVertical: 3,
		backgroundColor: 'rgba(15, 23, 42, 0.82)',
		gap: 4
	},
	imagePickerOverlayLabel: {
		color: colors.surface,
		width: 100,
		paddingBottom: 2,
		textAlign: 'center',
		fontSize: 10,
		fontFamily: 'Inter_600SemiBold'
	},
	avatarImage: {
		width: '100%',
		height: '100%'
	},
	avatarHint: {
		color: colors.textSecondary,
		fontSize: typography.caption,
		fontFamily: 'Inter_400Regular'
	},
	formCard: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		padding: spacing.md,
		gap: spacing.sm
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
	inputDisabled: {
		backgroundColor: colors.divider,
		color: colors.textSecondary
	}
})
