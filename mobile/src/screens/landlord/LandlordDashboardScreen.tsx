import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { api, RequestItem } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'
import { ROUTES } from '../../navigation/routes'

interface UnitItem {
  _id: string
}

export const LandlordDashboardScreen = () => {
  const navigation = useNavigation<any>()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [units, setUnits] = useState<UnitItem[]>([])

  useEffect(() => {
    const load = async () => {
      const requestRes = await api.get<RequestItem[]>('/requests')
      const unitsRes = await api.get<UnitItem[]>('/units')

      setRequests(requestRes.data)
      setUnits(unitsRes.data)
    }

    load()
  }, [])

  const totals = useMemo(() => {
    const activeRequests = requests.filter((item) => ['ASSIGNED', 'IN_PROGRESS'].includes(item.status)).length
    const pendingRequests = requests.filter((item) => ['NEW', 'DONE'].includes(item.status)).length

    return {
      totalUnits: units.length,
      activeRequests,
      pendingRequests
    }
  }, [requests, units])

  const recentRequests = useMemo(() => requests.slice(0, 5), [requests])

  return (
    <ScreenContainer>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statGrid}>
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

      <Text style={styles.sectionTitle}>Recently Updated Requests</Text>

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
    gap: spacing.sm
  },
  statCard: {
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
