import { useEffect, useMemo, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { SubScreenHeader } from '../../components/layout/SubScreenHeader'
import { ScreenContainer } from '../../components/ScreenContainer'
import { api } from '../../services/api'
import { LandlordRequestsStackParamList } from '../../navigation/types'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordRequestsStackParamList, 'AssignVendor'>

interface VendorItem {
  _id: string
  services?: string[]
  userId?: {
    name?: string
    email?: string
  }
}

export const AssignVendorScreen = ({ route, navigation }: Props) => {
  const [vendors, setVendors] = useState<VendorItem[]>([])
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('ALL')
  const [selectedVendor, setSelectedVendor] = useState<string>('')

  const loadVendors = async () => {
    try {
      const response = await api.get<VendorItem[]>('/vendors')
      setVendors(response.data)
    } catch {
      setVendors([])
    }
  }

  useEffect(() => {
    void loadVendors()
  }, [])

  const services = useMemo(() => {
    const set = new Set<string>()
    vendors.forEach((vendor) => (vendor.services || []).forEach((service) => set.add(service)))
    return ['ALL', ...Array.from(set)]
  }, [vendors])

  const filtered = useMemo(() => {
    return vendors.filter((vendor) => {
      const name = vendor.userId?.name || ''
      const bySearch = !search || name.toLowerCase().includes(search.toLowerCase())
      const byService = serviceFilter === 'ALL' || (vendor.services || []).includes(serviceFilter)
      return bySearch && byService
    })
  }, [vendors, search, serviceFilter])

  const onAssign = async () => {
    if (!selectedVendor) {
      return
    }

    try {
      await api.patch(`/requests/${route.params.requestId}/assign`, { vendorId: selectedVendor })
      navigation.goBack()
    } catch {
      return
    }
  }

  return (
    <ScreenContainer onRefresh={loadVendors}>
      <SubScreenHeader title='Assign Vendor' />

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder='Search vendor'
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      <View style={styles.filterRow}>
        {services.map((service) => (
          <Pressable
            key={service}
            style={[styles.chip, serviceFilter === service && styles.chipActive]}
            onPress={() => setServiceFilter(service)}
          >
            <Text style={[styles.chipText, serviceFilter === service && styles.chipTextActive]}>{service}</Text>
          </Pressable>
        ))}
      </View>

      {filtered.map((vendor) => (
        <Pressable
          key={vendor._id}
          style={[styles.card, selectedVendor === vendor._id && styles.cardActive]}
          onPress={() => setSelectedVendor(vendor._id)}
        >
          <Text style={styles.vendorName}>{vendor.userId?.name || 'Vendor'}</Text>
          <Text style={styles.vendorMeta}>{(vendor.services || []).join(', ') || 'No services listed'}</Text>
        </Pressable>
      ))}

      <AppButton title='Assign Vendor' onPress={onAssign} disabled={!selectedVendor} />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  chipTextActive: {
    color: colors.primary
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  cardActive: {
    borderColor: colors.primary
  },
  vendorName: {
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  vendorMeta: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium'
  }
})
