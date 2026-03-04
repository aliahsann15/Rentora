import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { SubScreenHeader } from '../../components/layout/SubScreenHeader'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { TenantRequestsStackParamList } from '../../navigation/types'
import { api, RequestItem } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<TenantRequestsStackParamList, 'TenantRequestDetails'>

export const TenantRequestDetailsScreen = ({ route }: Props) => {
  const [request, setRequest] = useState<RequestItem | null>(null)

  const loadRequest = async () => {
    const response = await api.get<RequestItem>(`/requests/${route.params.requestId}`)
    setRequest(response.data)
  }

  useEffect(() => {
    loadRequest()
  }, [route.params.requestId])

  if (!request) {
    return (
      <ScreenContainer onRefresh={loadRequest}>
        <SubScreenHeader title='Request Details' />
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer onRefresh={loadRequest}>
      <SubScreenHeader title='Request Details' />

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <StatusBadge status={request.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Assigned Vendor</Text>
        <Text style={styles.value}>{request.vendorId || 'Not assigned yet'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Timeline</Text>
        <Text style={styles.value}>Created: {new Date(request.createdAt).toLocaleString()}</Text>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
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
  label: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium'
  },
  value: {
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  }
})
