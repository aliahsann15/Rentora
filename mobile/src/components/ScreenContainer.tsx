import { ReactNode } from 'react'
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '../utils/theme'

interface ScreenContainerProps {
  children: ReactNode
  scrollable?: boolean
  style?: ViewStyle
}

export const ScreenContainer = ({ children, scrollable = true, style }: ScreenContainerProps) => {
  const RootWrapper = Platform.OS === 'android' ? SafeAreaView : View

  if (!scrollable) {
    return <RootWrapper style={[styles.root, style]}>{children}</RootWrapper>
  }

  return (
    <RootWrapper style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, style]}>{children}</ScrollView>
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
