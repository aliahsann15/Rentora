import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { SubScreenHeader } from '../../components/layout/SubScreenHeader'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { api, RequestItem } from '../../services/api'
import { LandlordRequestsStackParamList } from '../../navigation/types'
import { colors, radius, spacing, typography } from '../../utils/theme'
import { ROUTES } from '../../navigation/routes'

type Props = NativeStackScreenProps<LandlordRequestsStackParamList, 'RequestDetails'>

interface PropertyItem {
  _id: string
  name: string
}

interface UnitItem {
  _id: string
  unitNumber: string
}

interface TenantItem {
  _id: string
  name?: string
}

interface VendorItem {
  _id: string
  services?: string[]
  userId?: {
    name?: string
  }
}

interface RequestDisplayItem extends RequestItem {
  tenantName?: string
  vendorDisplay?: string
}

export const RequestDetailsScreen = ({ route, navigation }: Props) => {
  const [request, setRequest] = useState<RequestDisplayItem | null>(null)

  const resolveRequestDisplayFields = async (requestData: RequestItem): Promise<RequestDisplayItem> => {
    let propertyName = requestData.propertyName
    let unitNumber = requestData.unitNumber
    let tenantName: string | undefined
    let vendorDisplay: string | undefined

    if (!propertyName && requestData.propertyId) {
      try {
        const propertyRes = await api.get<PropertyItem>(`/properties/${requestData.propertyId}`)
        propertyName = propertyRes.data.name
      } catch {}
    }

    if (!unitNumber && requestData.unitId) {
      try {
        const unitsRes = await api.get<UnitItem[]>(
          requestData.propertyId ? `/units?propertyId=${requestData.propertyId}` : '/units'
        )

        const matchedUnit = unitsRes.data.find((item) => item._id === requestData.unitId)
        unitNumber = matchedUnit?.unitNumber
      } catch {}
    }

    if (requestData.tenantId) {
      try {
        const tenantRes = await api.get<TenantItem>(`/users/${requestData.tenantId}`)
        tenantName = tenantRes.data?.name || undefined
      } catch {}
    }

    if (requestData.vendorId) {
      try {
        const vendorsRes = await api.get<VendorItem[]>('/vendors')
        const matchedVendor = vendorsRes.data.find((vendor) => vendor._id === requestData.vendorId)

        if (matchedVendor) {
          const vendorName = matchedVendor.userId?.name || 'Vendor'
          const services = (matchedVendor.services || []).join(', ')
          vendorDisplay = services ? `${vendorName} (${services})` : vendorName
        }
      } catch {}
    }

    return {
      ...requestData,
      propertyName,
      unitNumber,
      tenantName,
      vendorDisplay
    }
  }

  const formatDateOnly = (value: string | undefined) => {
    if (!value) {
      return '—'
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }

    return parsed.toLocaleDateString('en-CA')
  }

  const loadRequest = async () => {
    try {
      const response = await api.get<RequestItem>(`/requests/${route.params.requestId}`)
      const normalizedRequest = await resolveRequestDisplayFields(response.data)
      setRequest(normalizedRequest)
    } catch {
      setRequest(null)
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadRequest()
    }, [route.params.requestId])
  )

  const updateStatus = async (status: 'ASSIGNED' | 'IN_PROGRESS' | 'DONE') => {
    if (!request) {
      return
    }

    try {
      const response = await api.patch<RequestItem>(`/requests/${request._id}/status`, { status })
      const normalizedRequest = await resolveRequestDisplayFields({
        ...response.data,
        propertyName: response.data.propertyName || request.propertyName,
        unitNumber: response.data.unitNumber || request.unitNumber
      })
      setRequest(normalizedRequest)
    } catch {
      return
    }
  }

  const markDone = async () => {
    await updateStatus('DONE')
  }

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
          <Text style={styles.section}>Tenant Info</Text>
          <Text style={styles.value}>Tenant: {request.tenantName || '—'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.section}>Property + Unit</Text>
          <Text style={styles.value}>Property: {request.propertyName || request.propertyId || '—'}</Text>
          <Text style={styles.value}>Unit: {request.unitNumber || request.unitId || '—'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.section}>Images (gallery)</Text>
          <View style={styles.galleryRow}>
            {(request as any).images?.length ? (
              (request as any).images.map((uri: string) => <Image key={uri} source={{ uri }} style={styles.image} />)
            ) : (
              <Text style={styles.value}>No images</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.section}>Status</Text>
          <StatusBadge status={request.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.section}>Activity Timeline</Text>
          <Text style={styles.value}>Created at: {formatDateOnly(request.createdAt)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <Text style={styles.section}>Assigned Vendor</Text>
          <Text style={styles.value}>{request.vendorDisplay || 'Not assigned'}</Text>
        </View>
      </View>

      <AppButton title='Assign Vendor' onPress={() => navigation.navigate(ROUTES.ASSIGN_VENDOR, { requestId: request._id })} />

      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionBtn, styles.doneBtn]} onPress={markDone}>
          <Text style={[styles.actionText, styles.doneText]}>Mark Done</Text>
        </Pressable>
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
  section: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold'
  },
  value: {
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  },
  galleryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.divider
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionText: {
    fontSize: typography.bodyM,
    fontFamily: 'Inter_500Medium',
    color: colors.primary
  },
  doneBtn: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft
  },
  doneText: {
    color: colors.success
  }
})
