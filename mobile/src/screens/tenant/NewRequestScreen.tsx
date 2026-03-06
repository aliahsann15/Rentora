import { useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { api } from '../../services/api'
import { createMaintenanceRequest, clearRequestError } from '../../slices/requestsSlice'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useAppAlert } from '../../hooks/useAppAlert'
import { colors, radius, spacing, typography } from '../../utils/theme'

interface AssignedUnitItem {
  unitId: string
  propertyId: string
  unitNumber: string
}

export const NewRequestScreen = () => {
  const dispatch = useAppDispatch()
  const { creating, error } = useAppSelector((state) => state.request)
  const currentUser = useAppSelector((state) => state.auth.user)
  const { showToast } = useAppAlert()

  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [images, setImages] = useState<string[]>([])

  const loadTenantAssignment = async () => {
    if (!currentUser?._id) {
      return
    }

    try {
      const unitRes = await api.get<AssignedUnitItem>('/auth/me-assignment')

      const assignedUnit = unitRes.data

      if (!assignedUnit) {
        setPropertyId('')
        setUnitId('')
        setUnitNumber('')
        showToast({
          type: 'error',
          message: 'No assigned unit found for your account.'
        })
        return
      }

      setPropertyId(assignedUnit.propertyId)
      setUnitId(assignedUnit.unitId)
      setUnitNumber(assignedUnit.unitNumber)
    } catch {
      setPropertyId('')
      setUnitId('')
      setUnitNumber('')
    }
  }

  useEffect(() => {
    void loadTenantAssignment()
  }, [currentUser?._id])

  const pickImages = async () => {
    try {
      const imagePickerModule = await import('expo-image-picker')

      const permission = await imagePickerModule.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        showToast({
          type: 'error',
          message: 'Photo permission is required to select images.'
        })
        return
      }

      const result = await imagePickerModule.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 5
      })

      if (result.canceled) {
        return
      }

      const nextImages = result.assets.map((asset) => asset.uri)
      setImages((previous) => Array.from(new Set([...previous, ...nextImages])))
    } catch {
      showToast({
        type: 'error',
        message: 'Image picker is unavailable in the current app build. Rebuild the dev client and try again.'
      })
      return
    }
  }

  const removeImage = (uri: string) => {
    setImages((previous) => previous.filter((item) => item !== uri))
  }

  const onSubmit = () => {
    if (!propertyId || !unitId || !title || !description) {
      showToast({
        type: 'error',
        message: 'Property and unit must be assigned before submitting a request.'
      })
      return
    }

    dispatch(clearRequestError())
    dispatch(
      createMaintenanceRequest({
        propertyId,
        unitId,
        title,
        description,
        urgency,
        images
      })
    )

    setTitle('')
    setDescription('')
    setImages([])
  }

  return (
    <ScreenContainer onRefresh={loadTenantAssignment}>
      <Text style={styles.title}>New Request</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Assigned Unit</Text>
        <Text style={styles.assignmentValue}>{unitNumber ? `Unit ${unitNumber}` : 'No unit assigned'}</Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder='Issue title'
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder='Describe the issue'
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Urgency</Text>
        <View style={styles.urgencyRow}>
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((value) => (
            <Pressable
              key={value}
              style={[
                styles.urgencyChip,
                urgency === value && styles.urgencyChipActive,
                value === 'HIGH' && urgency === value && styles.urgencyChipHighActive
              ]}
              onPress={() => setUrgency(value)}
            >
              <Text
                style={[
                  styles.urgencyChipText,
                  urgency === value && styles.urgencyChipTextActive,
                  value === 'HIGH' && urgency === value && styles.urgencyChipHighTextActive
                ]}
              >
                {value === 'LOW' ? 'Low' : value === 'MEDIUM' ? 'Medium' : 'High'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Upload Photos</Text>
        <AppButton title='Select Images' variant='secondary' onPress={pickImages} />
        <Text style={styles.selectedImagesText}>{images.length > 0 ? `${images.length} image(s) selected` : 'No images selected'}</Text>
        {images.length > 0 ? (
          <View style={styles.imageGrid}>
            {images.map((uri) => (
              <View key={uri} style={styles.imageThumbWrap}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <Pressable style={styles.removeImageButton} onPress={() => removeImage(uri)}>
                  <Text style={styles.removeImageButtonText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton title='Submit' onPress={onSubmit} loading={creating} />
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  label: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  },
  textArea: {
    height: 90,
    paddingTop: spacing.sm,
    textAlignVertical: 'top'
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  urgencyChip: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  urgencyChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  urgencyChipHighActive: {
    borderColor: colors.danger,
    backgroundColor: colors.danger
  },
  urgencyChipText: {
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary
  },
  urgencyChipTextActive: {
    color: colors.primary
  },
  urgencyChipHighTextActive: {
    color: colors.surface
  },
  assignmentValue: {
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  selectedImagesText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  imageThumbWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.divider
  },
  imageThumb: {
    width: '100%',
    height: '100%'
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger
  },
  removeImageButtonText: {
    color: colors.surface,
    fontSize: typography.caption,
    fontFamily: 'Inter_700Bold',
    lineHeight: 14
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
