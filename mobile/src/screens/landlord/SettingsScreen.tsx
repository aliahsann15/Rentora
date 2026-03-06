import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '../../components/ScreenContainer'
import { useAppAlert } from '../../hooks/useAppAlert'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { ROUTES } from '../../navigation/routes'
import { LandlordSettingsStackScreenProps } from '../../navigation/types'
import { logout } from '../../slices/authSlice'
import { colors, radius, spacing, typography } from '../../utils/theme'

type SettingsItem = {
  key: 'Profile' | 'Change Password' | 'Payment Methods' | 'Transactions' | 'Logout'
  label: string
  icon: keyof typeof Ionicons.glyphMap
  isDanger?: boolean
}

const settingsItems: SettingsItem[] = [
  { key: 'Profile', label: 'Profile', icon: 'person-outline' },
  { key: 'Change Password', label: 'Change Password', icon: 'key-outline' },
  { key: 'Payment Methods', label: 'Payment Methods', icon: 'card-outline' },
  { key: 'Transactions', label: 'Transactions', icon: 'receipt-outline' },
  { key: 'Logout', label: 'Logout', icon: 'log-out-outline', isDanger: true }
]

export const SettingsScreen = () => {
  const navigation = useNavigation<LandlordSettingsStackScreenProps<'SettingsHome'>['navigation']>()
  const dispatch = useAppDispatch()
  const { showAlert, showToast } = useAppAlert()

  const confirmLogout = () => {
    showAlert({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      actions: [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout())
          }
        }
      ]
    })
  }

  const handleItemPress = (item: SettingsItem) => {
    if (item.key === 'Logout') {
      confirmLogout()
      return
    }

    if (item.key === 'Profile') {
      navigation.navigate(ROUTES.LANDLORD_PROFILE)
      return
    }

    if (item.key === 'Change Password') {
      navigation.navigate(ROUTES.CHANGE_PASSWORD)
      return
    }

    showToast({
      type: 'info',
      message: `${item.label} will be available soon`
    })
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.listCard}>
        {settingsItems.map((item, index) => {
          const textColor = item.isDanger ? colors.danger : colors.textPrimary

          return (
            <Pressable key={item.key} style={styles.row} onPress={() => handleItemPress(item)}>
              <View style={styles.leftBlock}>
                <Ionicons name={item.icon} size={20} color={textColor} />
                <Text style={[styles.rowLabel, { color: textColor }]}>{item.label}</Text>
              </View>

              <Ionicons name='chevron-forward' size={20} color={colors.textMuted} />
              {index < settingsItems.length - 1 ? <View style={styles.rowDivider} /> : null}
            </Pressable>
          )
        })}
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
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden'
  },
  row: {
    minHeight: 58,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  rowLabel: {
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold'
  },
  rowDivider: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    height: 1,
    backgroundColor: colors.divider
  }
})
