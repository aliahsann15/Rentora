import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { SubScreenHeader } from '../../components/layout/SubScreenHeader'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppAlert } from '../../hooks/useAppAlert'
import { LandlordUsersStackParamList } from '../../navigation/types'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordUsersStackParamList, 'InviteUser'>

interface UnitItem {
  _id: string
  unitNumber: string
}

interface InviteResponse {
  token: string
  email: string
  role: 'LANDLORD' | 'TENANT' | 'VENDOR'
  testInviteLink?: string
}

interface CreateTenantResponse {
  message: string
  emailDelivered: boolean
  resetPasswordLink: string
  temporaryPassword: string
}

export const InviteUserScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'TENANT' | 'VENDOR'>('TENANT')
  const [units, setUnits] = useState<UnitItem[]>([])
  const [unitId, setUnitId] = useState<string>('')
  const { showAlert } = useAppAlert()

  const loadUnits = async () => {
    const response = await api.get<UnitItem[]>('/units')
    setUnits(response.data)
  }

  useEffect(() => {
    loadUnits()
  }, [])

  const onInvite = async () => {
    if (!email || !role) {
      return
    }

    if (role === 'TENANT') {
      const response = await api.post<CreateTenantResponse>('/users/tenant', {
        email,
        name: email.split('@')[0],
        unitId: unitId || undefined
      })

      showAlert({
        title: response.data.emailDelivered ? 'Tenant Added' : 'Tenant Added (Testing Mode)',
        message: `${response.data.message}\n\nTemporary Password (Testing):\n${response.data.temporaryPassword}`,
        link: {
          url: response.data.resetPasswordLink,
          label: response.data.resetPasswordLink
        },
        actions: [
          {
            text: 'Done',
            style: 'default',
            onPress: () => navigation.goBack()
          }
        ]
      })
      return
    }

    const response = await api.post<InviteResponse>('/invites', {
      email,
      role,
      unitId: undefined
    })

    const link = response.data.testInviteLink || `rentora://invite/${response.data.token}`

    showAlert({
      title: 'Invite created (Testing Mode)',
      message: `No SMTP is configured yet.\n\nTap the link below to open invite registration.\n\nToken:\n${response.data.token}`,
      link: {
        url: link,
        label: link
      },
      actions: [
        {
          text: 'Done',
          style: 'default',
          onPress: () => navigation.goBack()
        }
      ]
    })
  }

  return (
    <ScreenContainer onRefresh={loadUnits}>
      <SubScreenHeader title='Invite User' />

      <View style={styles.card}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder='Email'
          placeholderTextColor={colors.textMuted}
          autoCapitalize='none'
          keyboardType='email-address'
          style={styles.input}
        />

        <View style={styles.roleRow}>
          <Pressable style={[styles.roleBtn, role === 'TENANT' && styles.roleBtnActive]} onPress={() => setRole('TENANT')}>
            <Text style={[styles.roleText, role === 'TENANT' && styles.roleTextActive]}>Tenant</Text>
          </Pressable>
          <Pressable style={[styles.roleBtn, role === 'VENDOR' && styles.roleBtnActive]} onPress={() => setRole('VENDOR')}>
            <Text style={[styles.roleText, role === 'VENDOR' && styles.roleTextActive]}>Vendor</Text>
          </Pressable>
        </View>

        {role === 'TENANT' && (
          <View style={styles.unitWrap}>
            <Text style={styles.unitLabel}>Optional Unit selector</Text>
            <View style={styles.unitRow}>
              {units.slice(0, 6).map((unit) => (
                <Pressable
                  key={unit._id}
                  style={[styles.unitChip, unitId === unit._id && styles.unitChipActive]}
                  onPress={() => setUnitId(unit._id)}
                >
                  <Text style={[styles.unitChipText, unitId === unit._id && styles.unitChipTextActive]}>{unit.unitNumber}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <AppButton title='Send Invite' onPress={onInvite} />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md
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
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  roleText: {
    color: colors.textSecondary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold'
  },
  roleTextActive: {
    color: colors.primary
  },
  unitWrap: {
    gap: spacing.sm
  },
  unitLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  unitChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  unitChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  unitChipText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  unitChipTextActive: {
    color: colors.primary
  }
})
