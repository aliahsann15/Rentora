import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppAlert } from '../../hooks/useAppAlert'
import { LandlordUsersStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordUsersStackParamList, 'UsersList'>

interface UserItem {
  _id: string
  name: string
  email: string
  role: 'TENANT' | 'VENDOR' | 'LANDLORD'
  assignedUnitNumber?: string | null
}

interface UnitItem {
  _id: string
  unitNumber: string
  tenantId?: string
}

export const UsersListScreen = ({ navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'TENANT' | 'VENDOR'>('TENANT')
  const [users, setUsers] = useState<UserItem[]>([])
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const { showAlert, showToast } = useAppAlert()

  const loadUsers = useCallback(async () => {
    try {
      const [usersResponse, unitsResponse] = await Promise.all([
        api.get<UserItem[]>(`/users?role=${activeTab}`),
        api.get<UnitItem[]>('/units')
      ])

      const unitByTenantId = unitsResponse.data.reduce<Record<string, string>>((accumulator, unit) => {
        if (unit.tenantId) {
          accumulator[unit.tenantId] = unit.unitNumber
        }
        return accumulator
      }, {})

      const usersWithUnits = usersResponse.data.map((user) => ({
        ...user,
        assignedUnitNumber:
          user.role === 'TENANT'
            ? user.assignedUnitNumber || unitByTenantId[user._id] || null
            : null
      }))

      setUsers(usersWithUnits)
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to load users. Please pull to refresh and try again.'
      })
    }
  }, [activeTab, showToast])

  useFocusEffect(
    useCallback(() => {
      void loadUsers()
    }, [loadUsers])
  )

  const deleteUser = async (user: UserItem) => {
    setDeletingUserId(user._id)
    try {
      await api.delete(`/users/${user._id}`)
      setUsers((previous) => previous.filter((item) => item._id !== user._id))
      showToast({
        type: 'success',
        message: `${user.role === 'TENANT' ? 'Tenant' : 'Vendor'} deleted successfully.`
      })
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast({
        type: 'error',
        message: message || 'Unable to delete this user right now.'
      })
    } finally {
      setDeletingUserId(null)
    }
  }

  const confirmDelete = (user: UserItem) => {
    showAlert({
      title: `Delete ${user.role === 'TENANT' ? 'tenant' : 'vendor'}?`,
      message:
        user.role === 'TENANT'
          ? 'This will remove the tenant from the assigned unit and permanently delete the tenant user and related records.'
          : 'This will permanently delete the vendor user and related records.',
      actions: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteUser(user)
          }
        }
      ]
    })
  }

  return (
    <ScreenContainer onRefresh={loadUsers}>
      <Text style={styles.title}>Users</Text>

      <View style={styles.innerTabs}>
        <Pressable style={[styles.innerTabBtn, activeTab === 'TENANT' && styles.innerTabBtnActive]} onPress={() => setActiveTab('TENANT')}>
          <Text style={[styles.innerTabText, activeTab === 'TENANT' && styles.innerTabTextActive]}>Tenants</Text>
        </Pressable>
        <Pressable style={[styles.innerTabBtn, activeTab === 'VENDOR' && styles.innerTabBtnActive]} onPress={() => setActiveTab('VENDOR')}>
          <Text style={[styles.innerTabText, activeTab === 'VENDOR' && styles.innerTabTextActive]}>Vendors</Text>
        </Pressable>
      </View>

      {users.map((user) => (
        <Pressable
          key={user._id}
          style={styles.card}
          onPress={() => {
            if (user.role === 'VENDOR') {
              navigation.navigate(ROUTES.VENDOR_DETAILS, { vendorId: user._id })
            }
          }}
        >
          <View style={styles.headerRow}>
            <Text style={styles.name}>{user.name}</Text>
            <Pressable
              style={styles.deleteButton}
              onPress={(event) => {
                event.stopPropagation()
                confirmDelete(user)
              }}
              disabled={deletingUserId === user._id}
            >
              {deletingUserId === user._id ? (
                <Text style={styles.deleteIcon}>…</Text>
              ) : (
                <Ionicons name='trash-outline' size={18} color={colors.danger} />
              )}
            </Pressable>
          </View>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.meta}>
            {user.role === 'TENANT'
              ? `Unit: ${user.assignedUnitNumber || 'Unassigned'}`
              : 'Vendor'}
          </Text>
        </Pressable>
      ))}

      <Pressable style={styles.inviteBtn} onPress={() => navigation.navigate(ROUTES.INVITE_USER)}>
        <Text style={styles.inviteBtnText}>
          {activeTab === 'TENANT' ? 'Add Tenant' : 'Invite Vendor'}
        </Text>
      </Pressable>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.headingL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  innerTabs: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  innerTabBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  innerTabBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  innerTabText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.bodyM
  },
  innerTabTextActive: {
    color: colors.primary
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  name: {
    flex: 1,
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  deleteIcon: {
    fontSize: 16,
    color: colors.danger,
    fontFamily: 'Inter_600SemiBold'
  },
  meta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  },
  inviteBtn: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inviteBtnText: {
    color: colors.surface,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold'
  }
})
