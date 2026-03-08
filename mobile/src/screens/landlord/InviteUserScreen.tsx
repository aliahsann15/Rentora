import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
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
  status?: 'OCCUPIED' | 'VACANT'
  tenantId?: string
}

interface InviteResponse {
  token: string
  email: string
  role: 'LANDLORD' | 'TENANT' | 'VENDOR'
  emailDelivered: boolean
  emailFailureReason?: string
}

interface CreateTenantResponse {
  message: string
  emailDelivered: boolean
  emailFailureReason?: string
}

export const InviteUserScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'TENANT' | 'VENDOR'>('TENANT')
  const [units, setUnits] = useState<UnitItem[]>([])
  const [unitId, setUnitId] = useState<string>('')
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { showAlert, showToast } = useAppAlert()

  const loadUnits = async () => {
    try {
      const response = await api.get<UnitItem[]>('/units')
      setUnits(response.data)
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to load units. Please pull to refresh and try again.'
      })
    }
  }

  useEffect(() => {
    void loadUnits()
  }, [])

  const onInvite = async () => {
    if (!email || !role || submitting) {
      return
    }

    if (role === 'TENANT' && !unitId) {
      showToast({
        type: 'error',
        message: 'Please select a unit before adding a tenant.'
      })
      return
    }

    setSubmitting(true)
    try {
      if (role === 'TENANT') {
        const response = await api.post<CreateTenantResponse>('/users/tenant', {
          email,
          name: email.split('@')[0],
          unitId
        })

        showToast(
          response.data.emailDelivered
            ? {
                type: 'success',
                message: 'Tenant added successfully. Login and password-reset instructions were sent by email.'
              }
            : {
                type: 'error',
                message: response.data.emailFailureReason
                  ? `Tenant added, but email could not be delivered (${response.data.emailFailureReason}).`
                  : 'Tenant added, but email could not be delivered.'
              }
        )
        navigation.goBack()
        return
      }

      const response = await api.post<InviteResponse>('/invites', {
        email,
        role,
        unitId: undefined
      })

      showToast(
        response.data.emailDelivered
          ? {
              type: 'success',
              message: 'Invite email sent successfully.'
            }
          : {
              type: 'error',
              message: response.data.emailFailureReason
                ? `Invite created, but email could not be delivered (${response.data.emailFailureReason}).`
                : 'Invite created, but email could not be delivered.'
            }
      )
      navigation.goBack()
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast({
        type: 'error',
        message: message || 'Unable to process request. Please try again.'
      })
    } finally {
      setSubmitting(false)
    }
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
          <Pressable
            style={[styles.roleBtn, role === 'VENDOR' && styles.roleBtnActive]}
            onPress={() => {
              setRole('VENDOR')
              setIsUnitDropdownOpen(false)
            }}
          >
            <Text style={[styles.roleText, role === 'VENDOR' && styles.roleTextActive]}>Vendor</Text>
          </Pressable>
        </View>

        {role === 'TENANT' && (
          <View style={[styles.unitWrap, isUnitDropdownOpen && styles.unitWrapActive]}>
            <Text style={styles.unitLabel}>Unit selector (required)</Text>
            <Pressable
              style={styles.dropdownField}
              onPress={() => setIsUnitDropdownOpen((current) => !current)}
            >
              <Text style={styles.dropdownValue}>
                {units.find((item) => item._id === unitId)?.unitNumber || 'Select unit number'}
              </Text>
              <Ionicons
                name={isUnitDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>

            {isUnitDropdownOpen ? (
              <View style={styles.dropdownList}>
                {units.map((unit) => {
                  const isOccupied = unit.status === 'OCCUPIED' || Boolean(unit.tenantId)
                  const isSelected = unitId === unit._id

                  return (
                    <Pressable
                      key={unit._id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemActive,
                        isOccupied && styles.dropdownItemDisabled
                      ]}
                      disabled={isOccupied}
                      onPress={() => {
                        setUnitId(unit._id)
                        setIsUnitDropdownOpen(false)
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextActive,
                          isOccupied && styles.dropdownItemTextDisabled
                        ]}
                      >
                        Unit {unit.unitNumber}
                        {isOccupied ? ' (Occupied)' : ''}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}
          </View>
        )}

        <AppButton title='Send Invite' onPress={onInvite} loading={submitting} />
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
    gap: spacing.sm,
    position: 'relative'
  },
  unitWrapActive: {
    zIndex: 40,
    elevation: 40
  },
  unitLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  dropdownField: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dropdownValue: {
    fontSize: typography.bodyM,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium'
  },
  dropdownList: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    zIndex: 50,
    elevation: 12
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  dropdownItemActive: {
    backgroundColor: colors.primarySoft
  },
  dropdownItemDisabled: {
    backgroundColor: colors.backgroundDark
  },
  dropdownItemText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  },
  dropdownItemTextActive: {
    color: colors.primary
  },
  dropdownItemTextDisabled: {
    color: colors.surface
  }
})
