import { useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { ScreenContainer } from '../../components/ScreenContainer'
import { api } from '../../services/api'
import { LandlordPropertiesStackParamList } from '../../navigation/types'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordPropertiesStackParamList, 'AddProperty'>

export const AddPropertyScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  const onCreate = async () => {
    if (!name || !line1 || !city || !state) {
      return
    }

    await api.post('/properties', {
      name,
      address: {
        line1,
        city,
        state,
        country: 'Pakistan'
      }
    })

    navigation.goBack()
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Add Property</Text>
      <View style={styles.card}>
        <TextInput value={name} onChangeText={setName} placeholder='Property Name' placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={line1} onChangeText={setLine1} placeholder='Address Line' placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={city} onChangeText={setCity} placeholder='City' placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={state} onChangeText={setState} placeholder='State' placeholderTextColor={colors.textMuted} style={styles.input} />
        <AppButton title='Save Property' onPress={onCreate} />
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
