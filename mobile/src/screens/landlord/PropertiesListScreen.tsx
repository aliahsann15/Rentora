import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ScreenContainer } from '../../components/ScreenContainer'
import { LandlordPropertiesStackParamList } from '../../navigation/types'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordPropertiesStackParamList, 'PropertiesList'>

interface PropertyItem {
  _id: string
  name: string
  totalUnits?: number
  address?: {
    line1?: string
    city?: string
    state?: string
    country?: string
  }
}

export const PropertiesListScreen = ({ navigation }: Props) => {
  const [properties, setProperties] = useState<PropertyItem[]>([])

  useEffect(() => {
    const load = async () => {
      const response = await api.get<PropertyItem[]>('/properties')
      setProperties(response.data)
    }

    load()
  }, [])

  return (
    <ScreenContainer>
      <Text style={styles.title}>Properties</Text>

      {properties.map((property) => (
        <Pressable
          key={property._id}
          style={styles.card}
          onPress={() => navigation.navigate('PropertyDetails', { propertyId: property._id })}
        >
          <Text style={styles.name}>{property.name}</Text>
          <Text style={styles.meta}>Unit count: {property.totalUnits ?? '—'}</Text>
          <Text style={styles.meta}>
            Address: {[property.address?.line1, property.address?.city, property.address?.state].filter(Boolean).join(', ') || '—'}
          </Text>
        </Pressable>
      ))}

      <View style={styles.fabWrap}>
        <Pressable style={styles.fab} onPress={() => navigation.navigate('AddProperty')}>
          <Text style={styles.fabText}>＋ Add Property</Text>
        </Pressable>
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
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  name: {
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  meta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  fabWrap: {
    alignItems: 'flex-end'
  },
  fab: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fabText: {
    color: colors.surface,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold'
  }
})
