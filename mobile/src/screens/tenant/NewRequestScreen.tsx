import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { api } from '../../services/api'
import { createMaintenanceRequest, clearRequestError } from '../../slices/requestsSlice'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { colors, radius, spacing, typography } from '../../utils/theme'

interface PropertyItem {
  _id: string
  name: string
}

interface UnitItem {
  _id: string
  propertyId: string
  unitNumber: string
}

export const NewRequestScreen = () => {
  const dispatch = useAppDispatch()
  const { creating, error } = useAppSelector((state) => state.requests)

  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [units, setUnits] = useState<UnitItem[]>([])

  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [photos, setPhotos] = useState('')

  const loadOptions = async () => {
    try {
      const propertyRes = await api.get<PropertyItem[]>('/properties')
      setProperties(propertyRes.data)

      if (propertyRes.data.length === 1) {
        setPropertyId(propertyRes.data[0]._id)
      }
    } catch {
      setProperties([])
    }

    try {
      const unitRes = await api.get<UnitItem[]>('/units')
      setUnits(unitRes.data)
    } catch {
      setUnits([])
    }
  }

  useEffect(() => {
    loadOptions()
  }, [])

  const filteredUnits = useMemo(() => {
    if (!propertyId) {
      return units
    }

    return units.filter((unit) => unit.propertyId === propertyId)
  }, [units, propertyId])

  useEffect(() => {
    if (filteredUnits.length === 1) {
      setUnitId(filteredUnits[0]._id)
    }
  }, [filteredUnits])

  const onSubmit = () => {
    if (!propertyId || !unitId || !title || !description) {
      return
    }

    dispatch(clearRequestError())
    dispatch(
      createMaintenanceRequest({
        propertyId,
        unitId,
        title,
        description: photos ? `${description}\n\nPhotos: ${photos}` : description,
        urgency
      })
    )

    setTitle('')
    setDescription('')
    setPhotos('')
  }

  return (
    <ScreenContainer onRefresh={loadOptions}>
      <Text style={styles.title}>New Request</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Property (auto if 1)</Text>
        <TextInput
          style={styles.input}
          value={propertyId}
          onChangeText={setPropertyId}
          placeholder='Property ID'
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Unit</Text>
        <TextInput
          style={styles.input}
          value={unitId}
          onChangeText={setUnitId}
          placeholder={filteredUnits[0] ? `Suggested: ${filteredUnits[0]._id}` : 'Unit ID'}
          placeholderTextColor={colors.textMuted}
        />

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
          <AppButton title='Low' variant='secondary' style={styles.urgencyBtn} onPress={() => setUrgency('LOW')} />
          <AppButton title='Medium' variant='secondary' style={styles.urgencyBtn} onPress={() => setUrgency('MEDIUM')} />
          <AppButton title='High' variant='danger' style={styles.urgencyBtn} onPress={() => setUrgency('HIGH')} />
        </View>

        <Text style={styles.label}>Upload Photos</Text>
        <TextInput
          style={styles.input}
          value={photos}
          onChangeText={setPhotos}
          placeholder='Photo URLs (comma separated)'
          placeholderTextColor={colors.textMuted}
        />

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
  urgencyBtn: {
    flex: 1
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
