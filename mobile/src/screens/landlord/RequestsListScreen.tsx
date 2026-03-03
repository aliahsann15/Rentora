import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { api, RequestItem } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'
import { LandlordRequestsStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'

type Props = NativeStackScreenProps<LandlordRequestsStackParamList, 'RequestsList'>

interface PropertyItem {
  _id: string
  name: string
}

const statuses = ['ALL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'VERIFIED'] as const
const urgencies = ['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const

export const RequestsListScreen = ({ navigation, route }: Props) => {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [status, setStatus] = useState<string>(route.params?.status || 'ALL')
  const [urgency, setUrgency] = useState<string>(route.params?.urgency || 'ALL')
  const [propertyId, setPropertyId] = useState<string>(route.params?.propertyId || 'ALL')
  const [propertySearch, setPropertySearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const [requestRes, propertiesRes] = await Promise.all([
        api.get<RequestItem[]>('/requests'),
        api.get<PropertyItem[]>('/properties')
      ])

      setRequests(requestRes.data)
      setProperties(propertiesRes.data)
    }

    load()
  }, [])

  const filteredProperties = useMemo(() => {
    if (!propertySearch.trim()) {
      return properties
    }

    return properties.filter((item) => item.name.toLowerCase().includes(propertySearch.toLowerCase()))
  }, [properties, propertySearch])

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const byStatus = status === 'ALL' || item.status === status
      const byUrgency = urgency === 'ALL' || item.urgency === urgency
      const byProperty = propertyId === 'ALL' || item.propertyId === propertyId
      return byStatus && byUrgency && byProperty
    })
  }, [requests, status, urgency, propertyId])

  const propertyNameMap = useMemo(() => {
    return Object.fromEntries(properties.map((property) => [property._id, property.name]))
  }, [properties])

  return (
    <ScreenContainer>
      <Text style={styles.title}>Requests</Text>

      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>Status</Text>
        <View style={styles.filterRow}>
          {statuses.map((value) => (
            <Pressable key={value} style={[styles.chip, status === value && styles.chipActive]} onPress={() => setStatus(value)}>
              <Text style={[styles.chipText, status === value && styles.chipTextActive]}>{value}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>Urgency</Text>
        <View style={styles.filterRow}>
          {urgencies.map((value) => (
            <Pressable key={value} style={[styles.chip, urgency === value && styles.chipActive]} onPress={() => setUrgency(value)}>
              <Text style={[styles.chipText, urgency === value && styles.chipTextActive]}>{value}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>Property</Text>
        <TextInput
          placeholder='Search property'
          value={propertySearch}
          onChangeText={setPropertySearch}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />
        <View style={styles.filterRow}>
          <Pressable style={[styles.chip, propertyId === 'ALL' && styles.chipActive]} onPress={() => setPropertyId('ALL')}>
            <Text style={[styles.chipText, propertyId === 'ALL' && styles.chipTextActive]}>ALL</Text>
          </Pressable>
          {filteredProperties.slice(0, 4).map((item) => (
            <Pressable
              key={item._id}
              style={[styles.chip, propertyId === item._id && styles.chipActive]}
              onPress={() => setPropertyId(item._id)}
            >
              <Text style={[styles.chipText, propertyId === item._id && styles.chipTextActive]}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filteredRequests.map((request) => (
        <Pressable key={request._id} style={styles.card} onPress={() => navigation.navigate(ROUTES.REQUEST_DETAILS, { requestId: request._id })}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{request.title}</Text>
            <StatusBadge status={request.status} />
          </View>
          <Text style={styles.meta}>Property: {propertyNameMap[request.propertyId || ''] || '—'}</Text>
          <Text style={[styles.meta, request.urgency === 'HIGH' ? styles.urgencyHigh : request.urgency === 'MEDIUM' ? styles.urgencyMedium : styles.urgencyLow]}>
            Urgency: {request.urgency}
          </Text>
        </Pressable>
      ))}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.headingL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  filterBlock: {
    gap: spacing.sm
  },
  filterLabel: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold'
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  chipTextActive: {
    color: colors.primary
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  meta: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium'
  },
  urgencyLow: {
    color: colors.success
  },
  urgencyMedium: {
    color: colors.warning
  },
  urgencyHigh: {
    color: colors.danger
  }
})
