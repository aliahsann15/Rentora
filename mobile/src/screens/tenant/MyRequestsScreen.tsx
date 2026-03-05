import { useEffect, useMemo, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { TenantRequestsStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { api, RequestItem } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<TenantRequestsStackParamList, 'MyRequestsList'>

interface PropertyItem {
  _id: string
  name: string
}

export const MyRequestsScreen = ({ navigation }: Props) => {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [properties, setProperties] = useState<PropertyItem[]>([])

  const loadRequests = async () => {
    try {
      const reqRes = await api.get<RequestItem[]>('/requests')
      setRequests(reqRes.data)
    } catch {
      setRequests([])
    }

    try {
      const propRes = await api.get<PropertyItem[]>('/properties')
      setProperties(propRes.data)
    } catch {
      setProperties([])
    }
  }

  useEffect(() => {
    void loadRequests()
  }, [])

  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map((property) => [property._id, property.name])),
    [properties]
  )

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
          <Text style={styles.meta}>Property: {propertyMap[request.propertyId || ''] || '—'}</Text>
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
