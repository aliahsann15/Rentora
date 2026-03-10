import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { api, RequestItem } from '../../services/api'
import { useAppAlert } from '../../hooks/useAppAlert'
import { subscribeNotifications } from '../../services/notificationsSocket'
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
  const { showToast } = useAppAlert()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [status, setStatus] = useState<string>(route.params?.status || 'ALL')
  const [urgency, setUrgency] = useState<string>(route.params?.urgency || 'ALL')
  const [propertyId, setPropertyId] = useState<string>(route.params?.propertyId || 'ALL')
  const [propertySearch, setPropertySearch] = useState('')
  const [isPropertyHintsOpen, setIsPropertyHintsOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isUrgencyOpen, setIsUrgencyOpen] = useState(false)

  const loadRequestsAndProperties = async () => {
    try {
      const [requestRes, propertiesRes] = await Promise.all([
        api.get<RequestItem[]>('/requests'),
        api.get<PropertyItem[]>('/properties')
      ])

      setRequests(requestRes.data)
      setProperties(propertiesRes.data)
    } catch (error: unknown) {
      setRequests([])
      setProperties([])

      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      const statusCode = (error as { response?: { status?: number } })?.response?.status
      const fallbackMessage = (error as { message?: string })?.message
      const statusPrefix = statusCode ? `(${statusCode}) ` : ''

      showToast({
        type: 'error',
        message: `${statusPrefix}${responseMessage || fallbackMessage || 'Unable to load requests. Please try again.'}`
      })
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadRequestsAndProperties()

      const unsubscribe = subscribeNotifications(() => {
        void loadRequestsAndProperties()
      })

      return () => {
        unsubscribe()
      }
    }, [])
  )

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

  const applyPropertySelection = (item: PropertyItem) => {
    setPropertyId(item._id)
    setPropertySearch(item.name)
    setIsPropertyHintsOpen(false)
  }

  return (
    <ScreenContainer onRefresh={loadRequestsAndProperties}>
      <Text style={styles.title}>Requests</Text>

      <View style={styles.dropdownRow}>
        <View style={[styles.dropdownFieldWrap, isStatusOpen && styles.dropdownFieldWrapActive]}>
          <Text style={styles.filterLabel}>Status</Text>
          <Pressable
            style={styles.dropdownField}
            onPress={() => {
              setIsStatusOpen((current) => !current)
              setIsUrgencyOpen(false)
            }}
          >
            <Text style={styles.dropdownValue}>{status}</Text>
            <Ionicons name={isStatusOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </Pressable>
          {isStatusOpen ? (
            <View style={styles.dropdownList}>
              {statuses.map((value) => (
                <Pressable
                  key={value}
                  style={[styles.dropdownItem, status === value && styles.dropdownItemActive]}
                  onPress={() => {
                    setStatus(value)
                    setIsStatusOpen(false)
                  }}
                >
                  <Text style={[styles.dropdownItemText, status === value && styles.dropdownItemTextActive]}>{value}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.dropdownFieldWrap, isUrgencyOpen && styles.dropdownFieldWrapActive]}>
          <Text style={styles.filterLabel}>Urgency</Text>
          <Pressable
            style={styles.dropdownField}
            onPress={() => {
              setIsUrgencyOpen((current) => !current)
              setIsStatusOpen(false)
            }}
          >
            <Text style={styles.dropdownValue}>{urgency}</Text>
            <Ionicons name={isUrgencyOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </Pressable>
          {isUrgencyOpen ? (
            <View style={styles.dropdownList}>
              {urgencies.map((value) => (
                <Pressable
                  key={value}
                  style={[styles.dropdownItem, urgency === value && styles.dropdownItemActive]}
                  onPress={() => {
                    setUrgency(value)
                    setIsUrgencyOpen(false)
                  }}
                >
                  <Text style={[styles.dropdownItemText, urgency === value && styles.dropdownItemTextActive]}>{value}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>Property</Text>
        <TextInput
          placeholder='Search property'
          value={propertySearch}
          onChangeText={(value) => {
            setPropertySearch(value)
            setIsPropertyHintsOpen(true)
          }}
          onFocus={() => {
            setIsPropertyHintsOpen(true)
            setIsStatusOpen(false)
            setIsUrgencyOpen(false)
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsPropertyHintsOpen(false)
            }, 120)
          }}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />
        {isPropertyHintsOpen ? (
          <View style={styles.propertyHintsList}>
            <Pressable
              style={[styles.dropdownItem, propertyId === 'ALL' && styles.dropdownItemActive]}
              onPress={() => {
                setPropertyId('ALL')
                setPropertySearch('')
                setIsPropertyHintsOpen(false)
              }}
            >
              <Text style={[styles.dropdownItemText, propertyId === 'ALL' && styles.dropdownItemTextActive]}>All properties</Text>
            </Pressable>

            {filteredProperties.length === 0 ? (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>No properties found</Text>
              </View>
            ) : (
              filteredProperties.slice(0, 8).map((item) => (
                <Pressable
                  key={item._id}
                  style={[styles.dropdownItem, propertyId === item._id && styles.dropdownItemActive]}
                  onPress={() => applyPropertySelection(item)}
                >
                  <Text style={[styles.dropdownItemText, propertyId === item._id && styles.dropdownItemTextActive]}>{item.name}</Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}
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
    gap: spacing.sm,
    position: 'relative'
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start'
  },
  dropdownFieldWrap: {
    flex: 1,
    gap: spacing.sm,
    position: 'relative'
  },
  dropdownFieldWrapActive: {
    zIndex: 40,
    elevation: 40
  },
  dropdownField: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dropdownValue: {
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium'
  },
  dropdownList: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    zIndex: 50,
    elevation: 12
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  dropdownItemActive: {
    backgroundColor: colors.primarySoft
  },
  dropdownItemText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  dropdownItemTextActive: {
    color: colors.primary
  },
  filterLabel: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    backgroundColor: colors.surface
  },
  propertyHintsList: {
    position: 'absolute',
    top: 78,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    zIndex: 35,
    elevation: 10
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
