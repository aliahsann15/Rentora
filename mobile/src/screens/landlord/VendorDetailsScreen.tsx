import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { LandlordUsersStackParamList } from '../../navigation/types'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordUsersStackParamList, 'VendorDetails'>

interface VendorItem {
  _id: string
  services?: string[]
  rating?: number
  totalJobs?: number
  userId?: {
    name?: string
    email?: string
  }
}

export const VendorDetailsScreen = ({ route }: Props) => {
  const [vendor, setVendor] = useState<VendorItem | null>(null)

  useEffect(() => {
    const load = async () => {
      const response = await api.get<VendorItem[]>('/vendors')
      const selected = response.data.find((item) => item._id === route.params.vendorId || (item.userId as any)?._id === route.params.vendorId)
      setVendor(selected || null)
    }

    load()
  }, [route.params.vendorId])

  return (
    <ScreenContainer>
      <Text style={styles.title}>Vendor Details</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{vendor?.userId?.name || '—'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{vendor?.userId?.email || '—'}</Text>

        <Text style={styles.label}>Services</Text>
        <Text style={styles.value}>{(vendor?.services || []).join(', ') || '—'}</Text>

        <Text style={styles.label}>Rating</Text>
        <Text style={styles.value}>{vendor?.rating ?? '—'}</Text>

        <Text style={styles.label}>Total Jobs</Text>
        <Text style={styles.value}>{vendor?.totalJobs ?? '—'}</Text>
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
    gap: spacing.xs
  },
  label: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium'
  },
  value: {
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  }
})
