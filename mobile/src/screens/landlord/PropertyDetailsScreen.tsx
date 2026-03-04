import { useEffect, useMemo, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SubScreenHeader } from '../../components/layout/SubScreenHeader'
import { ScreenContainer } from '../../components/ScreenContainer'
import { LandlordPropertiesStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordPropertiesStackParamList, 'PropertyDetails'>

interface UnitItem {
  _id: string
  propertyId: string
  unitNumber: string
  status: 'OCCUPIED' | 'VACANT'
}

interface PropertyItem {
  _id: string
  name: string
}

export const PropertyDetailsScreen = ({ route, navigation }: Props) => {
  const [property, setProperty] = useState<PropertyItem | null>(null)
  const [units, setUnits] = useState<UnitItem[]>([])

  const loadPropertyDetails = async () => {
    const [propertyRes, unitsRes] = await Promise.all([
      api.get<PropertyItem>(`/properties/${route.params.propertyId}`),
      api.get<UnitItem[]>('/units')
    ])

    setProperty(propertyRes.data)
    setUnits(unitsRes.data.filter((unit) => unit.propertyId === route.params.propertyId))
  }

  useEffect(() => {
    loadPropertyDetails()
  }, [route.params.propertyId])

  const occupiedCount = useMemo(() => units.filter((unit) => unit.status === 'OCCUPIED').length, [units])
  const vacantCount = useMemo(() => units.filter((unit) => unit.status === 'VACANT').length, [units])

  return (
    <ScreenContainer onRefresh={loadPropertyDetails}>
      <SubScreenHeader title={property?.name || 'Property Details'} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{occupiedCount}</Text>
          <Text style={styles.summaryLabel}>Occupied</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{vacantCount}</Text>
          <Text style={styles.summaryLabel}>Vacant</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Units list</Text>
      {units.map((unit) => (
        <Pressable key={unit._id} style={styles.unitCard} onPress={() => navigation.navigate(ROUTES.EDIT_UNIT, { unitId: unit._id })}>
          <Text style={styles.unitTitle}>Unit {unit.unitNumber}</Text>
          <Text style={[styles.unitStatus, unit.status === 'OCCUPIED' ? styles.occupied : styles.vacant]}>{unit.status}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.addUnitBtn} onPress={() => navigation.navigate(ROUTES.ADD_UNIT, { propertyId: route.params.propertyId })}>
        <Text style={styles.addUnitText}>Add Unit</Text>
      </Pressable>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  summaryValue: {
    fontSize: typography.headingM,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  summaryLabel: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  sectionTitle: {
    fontSize: typography.headingM,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  unitCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  unitTitle: {
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  unitStatus: {
    fontSize: typography.caption,
    fontFamily: 'Inter_600SemiBold'
  },
  occupied: {
    color: colors.success
  },
  vacant: {
    color: colors.warning
  },
  addUnitBtn: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addUnitText: {
    color: colors.surface,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold'
  }
})
