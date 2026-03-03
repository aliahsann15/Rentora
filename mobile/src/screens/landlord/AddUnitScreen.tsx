import { useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { LandlordPropertiesStackParamList } from '../../navigation/types'
import { api } from '../../services/api'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordPropertiesStackParamList, 'AddUnit'>

export const AddUnitScreen = ({ route, navigation }: Props) => {
  const [unitNumber, setUnitNumber] = useState('')

  const onCreate = async () => {
    if (!unitNumber) {
      return
    }

    await api.post('/units', {
      propertyId: route.params.propertyId,
      unitNumber,
      status: 'VACANT'
    })

    navigation.goBack()
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Add Unit</Text>
      <View style={styles.card}>
        <TextInput
          value={unitNumber}
          onChangeText={setUnitNumber}
          placeholder='Unit Number'
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <AppButton title='Save Unit' onPress={onCreate} />
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
  }
})
