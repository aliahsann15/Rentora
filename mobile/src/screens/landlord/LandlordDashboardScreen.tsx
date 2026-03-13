import { useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { api, RequestItem } from '../../services/api'
import { useAppAlert } from '../../hooks/useAppAlert'
import { subscribeNotifications } from '../../services/notificationsSocket'
import { colors, radius, spacing, typography } from '../../utils/theme'
import { ROUTES } from '../../navigation/routes'

interface UnitItem {
  _id: string
}

interface PropertyItem {
  _id: string
}

export const LandlordDashboardScreen = () => {
  const navigation = useNavigation<any>()
  const { showToast } = useAppAlert()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [units, setUnits] = useState<UnitItem[]>([])
  const [properties, setProperties] = useState<PropertyItem[]>([])

  const loadDashboard = async () => {
    try {
      const [requestRes, unitsRes, propertiesRes] = await Promise.all([
        api.get<RequestItem[]>('/requests'),
        api.get<UnitItem[]>('/units'),
        api.get<PropertyItem[]>('/properties')
      ])

      setRequests(requestRes.data)
      setUnits(unitsRes.data)
      setProperties(propertiesRes.data)
    } catch (error: unknown) {
      setRequests([])
      setUnits([])
      setProperties([])

      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      const statusCode = (error as { response?: { status?: number } })?.response?.status
      const fallbackMessage = (error as { message?: string })?.message
      const statusPrefix = statusCode ? `(${statusCode}) ` : ''

      showToast({
        type: 'error',
        message: `${statusPrefix}${responseMessage || fallbackMessage || 'Unable to load dashboard data. Please try again.'}`
      })
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadDashboard()

      const unsubscribe = subscribeNotifications(() => {
        void loadDashboard()
      })

      return () => {
        unsubscribe()
      }
    }, [])
  )

  const totals = useMemo(() => {
    const activeRequests = requests.filter((item) => ['ASSIGNED', 'IN_PROGRESS'].includes(item.status)).length
    const pendingRequests = requests.filter((item) => item.status === 'NEW').length

    return {
      totalProperties: properties.length,
      totalUnits: units.length,
      activeRequests,
      pendingRequests
    }
  }, [requests, units, properties])

  const recentRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 2),
    [requests]
  )

  return (
    <ScreenContainer onRefresh={loadDashboard}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statGrid}>
        <Pressable style={styles.statCard} onPress={() => navigation.navigate(ROUTES.PROPERTIES, { screen: ROUTES.PROPERTIES_LIST })}>
          <Text style={styles.statValue}>{totals.totalProperties}</Text>
          <Text style={styles.statLabel}>Total Properties</Text>
        </Pressable>

        <Pressable style={styles.statCard} onPress={() => navigation.navigate(ROUTES.REQUESTS, { screen: ROUTES.REQUESTS_LIST })}>
          <Text style={styles.statValue}>{totals.totalUnits}</Text>
          <Text style={styles.statLabel}>Total Units</Text>
        </Pressable>

        <Pressable
          style={styles.statCard}
          onPress={() => navigation.navigate(ROUTES.REQUESTS, { screen: ROUTES.REQUESTS_LIST, params: { status: 'IN_PROGRESS' } })}
        >
          <Text style={styles.statValue}>{totals.activeRequests}</Text>
          <Text style={styles.statLabel}>Active Requests</Text>
        </Pressable>

        <Pressable
          style={styles.statCard}
          onPress={() => navigation.navigate(ROUTES.REQUESTS, { screen: ROUTES.REQUESTS_LIST, params: { status: 'NEW' } })}
        >
          <Text style={styles.statValue}>{totals.pendingRequests}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Recent Requests</Text>

      {recentRequests.map((request) => (
        <Pressable
          key={request._id}
          style={styles.requestCard}
          onPress={() => navigation.navigate(ROUTES.REQUESTS, { screen: ROUTES.REQUEST_DETAILS, params: { requestId: request._id } })}
        >
          <View style={styles.requestHeader}>
            <Text style={styles.requestTitle}>{request.title}</Text>
            <StatusBadge status={request.status} />
          </View>
          <Text style={styles.requestMeta}>Urgency: {request.urgency}</Text>
        </Pressable>
      ))}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.headingL,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...{
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2
    }
  },
  statValue: {
    fontSize: typography.headingXL,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary
  },
  statLabel: {
    fontSize: typography.bodyM,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary
  },
  sectionTitle: {
    fontSize: typography.headingM,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...{
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2
    }
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm
  },
  requestTitle: {
    flex: 1,
    fontSize: typography.bodyL,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary
  },
  requestMeta: {
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted
  }
})
