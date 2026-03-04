import { ReactNode, useState } from 'react'
import { Platform, RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '../utils/theme'

interface ScreenContainerProps {
  children: ReactNode
  scrollable?: boolean
  style?: ViewStyle
  onRefresh?: () => Promise<void> | void
  refreshEnabled?: boolean
}

export const ScreenContainer = ({
  children,
  scrollable = true,
  style,
  onRefresh,
  refreshEnabled = true
}: ScreenContainerProps) => {
  const RootWrapper = Platform.OS === 'android' ? SafeAreaView : View
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!refreshEnabled) {
      return
    }

    setRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setRefreshing(false)
    }
  }

  if (!scrollable) {
    return <RootWrapper style={[styles.root, style]}>{children}</RootWrapper>
  }

  return (
    <RootWrapper style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, style]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} enabled={refreshEnabled} />}
      >
        {children}
      </ScrollView>
    </RootWrapper>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.md,
    gap: spacing.md
  }
})
