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

interface TenantAssignmentLookup {
  propertyId: string
  propertyName?: string
  unitId: string
  unitNumber: string
}

interface TenantRequestDisplayItem extends RequestItem {
  vendorName?: string
}

export const TenantRequestDetailsScreen = ({ route }: Props) => {
  const [request, setRequest] = useState<TenantRequestDisplayItem | null>(null)

  const loadRequest = async () => {
    try {
      const [requestRes, assignmentRes] = await Promise.all([
        api.get<RequestItem>(`/requests/${route.params.requestId}`),
        api.get<TenantAssignmentLookup>('/auth/me-assignment').catch(() => null)
      ])

      const assignment = assignmentRes?.data

      const normalizedRequest: TenantRequestDisplayItem = {
        ...requestRes.data,
        propertyName:
          requestRes.data.propertyName ||
          (assignment && requestRes.data.propertyId === assignment.propertyId
            ? assignment.propertyName
            : undefined),
        unitNumber:
          requestRes.data.unitNumber ||
          (assignment && requestRes.data.unitId === assignment.unitId
            ? assignment.unitNumber
            : undefined),
        vendorName: requestRes.data.vendorName || undefined
      }

      setRequest(normalizedRequest)
    } catch {
      setRequest(null)
    }
  }

  useEffect(() => {
    void loadRequest()
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

      <View style={styles.detailsPanel}>
        <View style={styles.detailSection}>
          <Text style={styles.label}>Request Title</Text>
          <Text style={styles.value}>{request.title || '—'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{request.description || '—'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.label}>Urgency</Text>
          <Text style={styles.value}>{request.urgency || '—'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.label}>Property</Text>
          <Text style={styles.value}>{request.propertyName || '—'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.label}>Unit Number</Text>
          <Text style={styles.value}>{request.unitNumber || '—'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.label}>Status</Text>
          <StatusBadge status={request.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.label}>Assigned Vendor</Text>
          <Text style={styles.value}>{request.vendorName || 'Not assigned yet'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.label}>Timeline</Text>
          <Text style={styles.value}>Created: {new Date(request.createdAt).toLocaleString()}</Text>
        </View>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  detailsPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailSection: {
    gap: spacing.xs,
    paddingVertical: spacing.md
  },
  divider: {
    height: 1,
    backgroundColor: colors.border
  },
  label: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold'
  },
  value: {
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  }
})
