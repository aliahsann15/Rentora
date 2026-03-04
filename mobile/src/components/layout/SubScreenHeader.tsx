import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, spacing, typography } from '../../utils/theme'

interface SubScreenHeaderProps {
  title: string
}

export const SubScreenHeader = ({ title }: SubScreenHeaderProps) => {
  const navigation = useNavigation<any>()

  return (
    <View style={styles.row}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name='chevron-back' size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: typography.headingL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  }
})
