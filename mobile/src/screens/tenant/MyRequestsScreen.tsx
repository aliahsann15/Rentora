import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { TenantRequestsStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { api, RequestItem } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<TenantRequestsStackParamList, 'MyRequestsList'>

interface TenantAssignmentLookup {
  propertyId: string
  propertyName?: string
  unitId: string
  unitNumber: string
}

export const MyRequestsScreen = ({ navigation }: Props) => {
  const [requests, setRequests] = useState<RequestItem[]>([])

  const loadRequests = async () => {
    try {
      const [reqRes, assignmentRes] = await Promise.all([
        api.get<RequestItem[]>('/requests'),
        api.get<TenantAssignmentLookup>('/auth/me-assignment').catch(() => null)
      ])

      const assignment = assignmentRes?.data

      const normalizedRequests = reqRes.data.map((request) => ({
        ...request,
        propertyName:
          request.propertyName ||
          (assignment && request.propertyId === assignment.propertyId
            ? assignment.propertyName
            : undefined),
        unitNumber:
          request.unitNumber ||
          (assignment && request.unitId === assignment.unitId ? assignment.unitNumber : undefined)
      }))

      setRequests(normalizedRequests)
    } catch {
      setRequests([])
    }
  }

  useEffect(() => {
    void loadRequests()
  }, [])

  return (
    <ScreenContainer onRefresh={loadRequests}>
      <Text style={styles.title}>My Requests</Text>

      {requests.map((request) => (
        <Pressable
          key={request._id}
          style={styles.card}
          onPress={() => navigation.navigate(ROUTES.TENANT_REQUEST_DETAILS, { requestId: request._id })}
        >
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>{request.title}</Text>
            <StatusBadge status={request.status} />
          </View>
          <Text style={styles.meta}>Date: {new Date(request.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.meta}>Property: {request.propertyName || '—'}</Text>
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
  cardRow: {
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
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  }
})
