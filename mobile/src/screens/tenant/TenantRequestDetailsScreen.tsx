import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { TenantRequestsStackParamList } from '../../navigation/types'
import { api, RequestItem } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<TenantRequestsStackParamList, 'TenantRequestDetails'>

export const TenantRequestDetailsScreen = ({ route }: Props) => {
  const [request, setRequest] = useState<RequestItem | null>(null)

  useEffect(() => {
    const load = async () => {
      const response = await api.get<RequestItem>(`/requests/${route.params.requestId}`)
      setRequest(response.data)
    }

    load()
  }, [route.params.requestId])

  if (!request) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Request Details</Text>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Request Details</Text>

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
