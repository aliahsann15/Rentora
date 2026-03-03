import { ReactNode } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native'
import { colors, spacing } from '../utils/theme'

interface ScreenContainerProps {
  children: ReactNode
  scrollable?: boolean
  style?: ViewStyle
}

export const ScreenContainer = ({ children, scrollable = true, style }: ScreenContainerProps) => {
  if (!scrollable) {
    return <SafeAreaView style={[styles.root, style]}>{children}</SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, style]}>{children}</ScrollView>
    </SafeAreaView>
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
