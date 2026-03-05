import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { AppButton } from '../../components/AppButton'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'
import { useAppAlert } from '../../hooks/useAppAlert'

interface VendorServicesResponse {
  vendorId: string
  services: string[]
  isActive: boolean
}

export const VendorServicesScreen = () => {
  const [services, setServices] = useState<string[]>([])
  const [newService, setNewService] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showToast } = useAppAlert()

  const loadServices = async () => {
    setLoading(true)
    try {
      const response = await api.get<VendorServicesResponse>('/vendor-services/me')
      setServices(response.data.services || [])
    } catch {
      setServices([])
      showToast({
        type: 'error',
        message: 'Unable to load services.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadServices()
  }, [])

  const addService = async () => {
    const value = newService.trim()

    if (!value) {
      return
    }

    setSaving(true)
    try {
      const response = await api.post<VendorServicesResponse>('/vendor-services/me', { service: value })
      setServices(response.data.services || [])
      setNewService('')
      showToast({
        type: 'success',
        message: 'Service added.'
      })
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to add service.'
      })
    } finally {
      setSaving(false)
    }
  }

  const removeService = async (service: string) => {
    setSaving(true)
    try {
      const encoded = encodeURIComponent(service)
      const response = await api.delete<VendorServicesResponse>(`/vendor-services/me/${encoded}`)
      setServices(response.data.services || [])
      showToast({
        type: 'info',
        message: 'Service removed.'
      })
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to remove service.'
      })
    } finally {
      setSaving(false)
    }
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      const response = await api.put<VendorServicesResponse>('/vendor-services/me', {
        services
      })
      setServices(response.data.services || [])
      showToast({
        type: 'success',
        message: 'Services updated.'
      })
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to save services.'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenContainer onRefresh={loadServices}>
      <Text style={styles.title}>Services</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Add Service</Text>
        <TextInput
          style={styles.input}
          placeholder='e.g. Plumbing'
          placeholderTextColor={colors.textMuted}
          value={newService}
          onChangeText={setNewService}
        />
        <AppButton
          title='Add Service'
          onPress={addService}
          disabled={!newService.trim() || saving}
          loading={saving}
          variant='secondary'
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>My Services</Text>

        {loading ? <Text style={styles.empty}>Loading services...</Text> : null}

        {!loading && services.length === 0 ? (
          <Text style={styles.empty}>No services added yet.</Text>
        ) : null}

        {services.map((service) => (
          <View key={service} style={styles.serviceRow}>
            <Text style={styles.serviceText}>{service}</Text>
            <Pressable
              style={styles.removeButton}
              onPress={() => {
                void removeService(service)
              }}
              disabled={saving}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        ))}

        <AppButton
          title='Save Services'
          onPress={saveAll}
          loading={saving}
          disabled={saving || loading}
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
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  label: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  },
  empty: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium'
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface
  },
  serviceText: {
    flex: 1,
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium'
  },
  removeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  removeButtonText: {
    fontSize: typography.caption,
    color: colors.danger,
    fontFamily: 'Inter_600SemiBold'
  }
})
