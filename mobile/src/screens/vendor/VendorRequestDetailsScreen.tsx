import { useEffect, useMemo, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { VendorRequestsStackParamList } from '../../navigation/types'
import { api, RequestItem } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<VendorRequestsStackParamList, 'VendorRequestDetails'>

interface PropertyDetails {
  _id: string
  name: string
  address?: {
    line1?: string
    city?: string
    state?: string
    country?: string
    zip?: string
  }
}

interface TenantDetails {
  _id: string
  name: string
  email: string
  phone?: string
}

export const VendorRequestDetailsScreen = ({ route }: Props) => {
  const [request, setRequest] = useState<RequestItem | null>(null)
  const [property, setProperty] = useState<PropertyDetails | null>(null)
  const [tenant, setTenant] = useState<TenantDetails | null>(null)
  const [completionPhotos, setCompletionPhotos] = useState('')
  const [working, setWorking] = useState(false)

  const requestId = route.params.requestId

  const loadRequest = async () => {
    const requestResponse = await api.get<RequestItem>(`/requests/${requestId}`)
    const requestData = requestResponse.data
    setRequest(requestData)

    const jobs: Promise<unknown>[] = []

    if (requestData.propertyId) {
      jobs.push(
        api
          .get<PropertyDetails>(`/properties/${requestData.propertyId}`)
          .then((res) => {
            setProperty(res.data)
          })
          .catch(() => {
            setProperty(null)
          })
      )
    }

    if (requestData.tenantId) {
      jobs.push(
        api
          .get<TenantDetails>(`/users/${requestData.tenantId}`)
          .then((res) => {
            setTenant(res.data)
          })
          .catch(() => {
            setTenant(null)
          })
      )
    }

    await Promise.all(jobs)
  }

  useEffect(() => {
    loadRequest()
  }, [requestId])

  const imageList = useMemo(() => {
    if (!request?.images) {
      return []
    }

    return request.images
  }, [request])

  const updateStatus = async (status: 'IN_PROGRESS' | 'DONE') => {
    if (!request) {
      return
    }

    setWorking(true)
    try {
      await api.patch(`/requests/${request._id}/status`, { status })
      await loadRequest()
    } finally {
      setWorking(false)
    }
  }

  const uploadCompletionPhotos = async () => {
    if (!request || !completionPhotos.trim()) {
      return
    }

    const images = completionPhotos
      .split(',')
      .map((image) => image.trim())
      .filter(Boolean)

    if (images.length === 0) {
      return
    }

    setWorking(true)
    try {
      await api.patch(`/requests/${request._id}/images`, { images })
      setCompletionPhotos('')
      await loadRequest()
    } finally {
      setWorking(false)
    }
  }

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
        <Text style={styles.sectionTitle}>Property info</Text>
        <Text style={styles.value}>{property?.name || request.propertyId || '—'}</Text>
        <Text style={styles.value}>
          {property?.address
            ? `${property.address.line1 || ''}, ${property.address.city || ''}, ${property.address.state || ''}`
            : request.propertyId || '—'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tenant info</Text>
        <Text style={styles.value}>{tenant?.name || request.tenantId || '—'}</Text>
        <Text style={styles.value}>{tenant?.email || '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Images</Text>
        {imageList.length === 0 ? <Text style={styles.value}>No images</Text> : null}
        {imageList.map((image) => (
          <Text key={image} style={styles.imageText}>{image}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Status</Text>
        <StatusBadge status={request.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <AppButton
          title='Accept'
          variant='secondary'
          onPress={() => updateStatus('IN_PROGRESS')}
          disabled={request.status !== 'ASSIGNED'}
          loading={working}
        />
        <AppButton
          title='Start Work'
          variant='secondary'
          onPress={() => updateStatus('IN_PROGRESS')}
          disabled={request.status !== 'ASSIGNED'}
          loading={working}
        />
        <AppButton
          title='Mark Done'
          onPress={() => updateStatus('DONE')}
          disabled={request.status !== 'IN_PROGRESS'}
          loading={working}
        />
        <TextInput
          style={styles.input}
          value={completionPhotos}
          onChangeText={setCompletionPhotos}
          placeholder='Completion photo URLs (comma separated)'
          placeholderTextColor={colors.textMuted}
        />
        <AppButton
          title='Upload completion photos'
          variant='secondary'
          onPress={uploadCompletionPhotos}
          disabled={!completionPhotos.trim()}
          loading={working}
        />
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
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.textMuted,
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.caption
  },
  value: {
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.bodyM
  },
  imageText: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: typography.caption
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  }
})
