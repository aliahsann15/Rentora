import { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { LandlordUsersStackParamList } from '../../navigation/types'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordUsersStackParamList, 'UsersList'>

interface UserItem {
  _id: string
  name: string
  email: string
  role: 'TENANT' | 'VENDOR' | 'LANDLORD'
}

export const UsersListScreen = ({ navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'TENANT' | 'VENDOR'>('TENANT')
  const [users, setUsers] = useState<UserItem[]>([])

  useEffect(() => {
    const load = async () => {
      const response = await api.get<UserItem[]>(`/users?role=${activeTab}`)
      setUsers(response.data)
    }

    load()
  }, [activeTab])

  return (
    <ScreenContainer>
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
              navigation.navigate('VendorDetails', { vendorId: user._id })
            }
          }}
        >
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.meta}>{user.role}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.inviteBtn} onPress={() => navigation.navigate('InviteUser')}>
        <Text style={styles.inviteBtnText}>Invite User</Text>
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
  name: {
    fontSize: typography.bodyL,
    color: colors.textPrimary,
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
