import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { VendorRequestsStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { api, RequestItem } from '../../services/api'
import { useAppAlert } from '../../hooks/useAppAlert'
import { subscribeNotifications } from '../../services/notificationsPoller'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<VendorRequestsStackParamList, 'AssignedRequestsList'>

type RequestFilter = 'NEW' | 'IN_PROGRESS' | 'DONE'

const requestFilterStatusMap: Record<RequestFilter, 'ASSIGNED' | 'IN_PROGRESS' | 'DONE'> = {
  NEW: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE'
}

export const AssignedRequestsScreen = ({ navigation }: Props) => {
  const { showToast } = useAppAlert()
  const [activeFilter, setActiveFilter] = useState<RequestFilter>('NEW')
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const status = requestFilterStatusMap[activeFilter]
      const response = await api.get<RequestItem[]>('/requests', {
        params: { status }
      })
      setRequests(response.data)
    } catch (error: unknown) {
      setRequests([])

      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      const statusCode = (error as { response?: { status?: number } })?.response?.status
      const fallbackMessage = (error as { message?: string })?.message
      const statusPrefix = statusCode ? `(${statusCode}) ` : ''

      showToast({
        type: 'error',
        message: `${statusPrefix}${responseMessage || fallbackMessage || 'Unable to load assigned requests. Please try again.'}`
      })
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadRequests()

      const unsubscribe = subscribeNotifications(() => {
        void loadRequests()
      })

      return () => {
        unsubscribe()
      }
    }, [activeFilter])
  )

  return (
    <ScreenContainer onRefresh={loadRequests}>
      <Text style={styles.title}>Assigned Requests</Text>

      <View style={styles.filterRow}>
        {(['NEW', 'IN_PROGRESS', 'DONE'] as RequestFilter[]).map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterLabel, activeFilter === filter && styles.filterLabelActive]}>{filter}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? <Text style={styles.muted}>Loading...</Text> : null}

      {!loading && requests.length === 0 ? (
        <Text style={styles.muted}>No requests found for {activeFilter}</Text>
      ) : null}

      {requests.map((request) => (
        <Pressable
          key={request._id}
          style={styles.card}
          onPress={() => navigation.navigate(ROUTES.VENDOR_REQUEST_DETAILS, { requestId: request._id })}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{request.title}</Text>
            <StatusBadge status={request.status} />
          </View>
          <Text style={styles.meta}>Urgency: {request.urgency}</Text>
          <Text style={styles.meta}>Created: {new Date(request.createdAt).toLocaleDateString()}</Text>
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  filterButton: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  filterLabel: {
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.caption
  },
  filterLabelActive: {
    color: colors.surface
  },
  muted: {
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium',
    fontSize: typography.caption
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  cardTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.bodyL
  },
  meta: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: typography.caption
  }
})
