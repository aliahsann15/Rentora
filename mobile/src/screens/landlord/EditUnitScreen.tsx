import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { SubScreenHeader } from '../../components/layout/SubScreenHeader'
import { ScreenContainer } from '../../components/ScreenContainer'
import { LandlordPropertiesStackParamList } from '../../navigation/types'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordPropertiesStackParamList, 'EditUnit'>

interface UnitItem {
  _id: string
  unitNumber: string
  status: 'OCCUPIED' | 'VACANT'
}

export const EditUnitScreen = ({ route, navigation }: Props) => {
  const [unit, setUnit] = useState<UnitItem | null>(null)
  const [unitNumber, setUnitNumber] = useState('')
  const [status, setStatus] = useState<'OCCUPIED' | 'VACANT'>('VACANT')

  const loadUnit = async () => {
    try {
      const response = await api.get<UnitItem[]>('/units')
      const selected = response.data.find((item) => item._id === route.params.unitId)
      if (selected) {
        setUnit(selected)
        setUnitNumber(selected.unitNumber)
        setStatus(selected.status)
      }
    } catch {
      setUnit(null)
    }
  }

  useEffect(() => {
    void loadUnit()
  }, [route.params.unitId])

  const onSave = async () => {
    if (!unit) {
      return
    }

    try {
      await api.patch(`/units/${unit._id}`, {
        unitNumber,
        status
      })

      navigation.goBack()
    } catch {
      return
    }
  }

  return (
    <ScreenContainer onRefresh={loadUnit}>
      <SubScreenHeader title='Edit Unit' />

      <View style={styles.card}>
        <TextInput
          value={unitNumber}
          onChangeText={setUnitNumber}
          placeholder='Unit Number'
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.statusRow}>
          <Pressable style={[styles.statusChip, status === 'OCCUPIED' && styles.statusChipActive]} onPress={() => setStatus('OCCUPIED')}>
            <Text style={[styles.statusText, status === 'OCCUPIED' && styles.statusTextActive]}>Occupied</Text>
          </Pressable>
          <Pressable style={[styles.statusChip, status === 'VACANT' && styles.statusChipActive]} onPress={() => setStatus('VACANT')}>
            <Text style={[styles.statusText, status === 'VACANT' && styles.statusTextActive]}>Vacant</Text>
          </Pressable>
        </View>

        <AppButton title='Update Unit' onPress={onSave} />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md
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
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  statusChip: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_500Medium'
  },
  statusTextActive: {
    color: colors.primary
  }
})
