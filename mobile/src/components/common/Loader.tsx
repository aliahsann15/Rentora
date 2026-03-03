import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { colors } from '../../utils/theme'

export const Loader = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size='large' color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
