import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppAlert } from '../../hooks/useAppAlert'
import { LandlordPropertiesStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
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
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null)
  const { showAlert } = useAppAlert()

  useEffect(() => {
    const load = async () => {
      const response = await api.get<PropertyItem[]>('/properties')
    setProperties(response.data)
  }

    load()
  }, [])

  const deleteProperty = async (propertyId: string) => {
    setDeletingPropertyId(propertyId)
    try {
      await api.delete(`/properties/${propertyId}`)
      setProperties((previous) => previous.filter((item) => item._id !== propertyId))
    } catch {
      showAlert({
        title: 'Delete failed',
        message: 'Unable to delete this property right now.'
      })
    } finally {
      setDeletingPropertyId(null)
    }
  }

  const confirmDelete = (property: PropertyItem) => {
    showAlert({
      title: 'Delete property?',
      message: `This will permanently delete ${property.name}, related units, requests, tenant links, and other related records.`,
      actions: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteProperty(property._id)
          }
        }
      ]
    })
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Properties</Text>

      {properties.map((property) => (
        <Pressable
          key={property._id}
          style={styles.card}
          onPress={() => navigation.navigate(ROUTES.PROPERTY_DETAILS, { propertyId: property._id })}
        >
          <View style={styles.headerRow}>
            <Text style={styles.name}>{property.name}</Text>
            <Pressable
              style={styles.deleteButton}
              onPress={(event) => {
                event.stopPropagation()
                confirmDelete(property)
              }}
              disabled={deletingPropertyId === property._id}
            >
              <Text style={styles.deleteIcon}>{deletingPropertyId === property._id ? '…' : '🗑'}</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>Unit count: {property.totalUnits ?? '—'}</Text>
          <Text style={styles.meta}>
            Address: {[property.address?.line1, property.address?.city, property.address?.state].filter(Boolean).join(', ') || '—'}
          </Text>
        </Pressable>
      ))}

      <View style={styles.fabWrap}>
        <Pressable style={styles.fab} onPress={() => navigation.navigate(ROUTES.ADD_PROPERTY)}>
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
    flex: 1,
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  deleteIcon: {
    fontSize: 16,
    color: colors.danger,
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
