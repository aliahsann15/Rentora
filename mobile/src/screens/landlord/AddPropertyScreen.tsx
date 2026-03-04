import { useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppButton } from '../../components/AppButton'
import { SubScreenHeader } from '../../components/layout/SubScreenHeader'
import { ScreenContainer } from '../../components/ScreenContainer'
import { api } from '../../services/api'
import { LandlordPropertiesStackParamList } from '../../navigation/types'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<LandlordPropertiesStackParamList, 'AddProperty'>

const countries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  "Cote d'Ivoire",
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czechia',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe'
]

export const AddPropertyScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState(countries[0])
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCreate = async () => {
    if (!name || !line1 || !city || !state || !zip || !country) {
      setError('All fields are required')
      return
    }

    try {
      setError(null)
      await api.post('/properties', {
        name,
        address: {
          line1,
          city,
          state,
          country,
          zip
        }
      })

      navigation.goBack()
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Failed to create property')
    }
  }

  return (
    <ScreenContainer>
      <SubScreenHeader title='Add Property' />
      <View style={styles.card}>
        <TextInput value={name} onChangeText={setName} placeholder='Property Name' placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={line1} onChangeText={setLine1} placeholder='Address Line' placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={city} onChangeText={setCity} placeholder='City' placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={state} onChangeText={setState} placeholder='State' placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={zip} onChangeText={setZip} placeholder='Zip Code' placeholderTextColor={colors.textMuted} style={styles.input} />

        <View style={styles.dropdownWrap}>
          <Pressable style={styles.dropdownButton} onPress={() => setIsCountryOpen((current) => !current)}>
            <Text style={styles.dropdownText}>{country}</Text>
          </Pressable>

          {isCountryOpen ? (
            <View style={styles.dropdownList}>
              {countries.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.dropdownItem, item === country && styles.dropdownItemActive]}
                  onPress={() => {
                    setCountry(item)
                    setIsCountryOpen(false)
                  }}
                >
                  <Text style={[styles.dropdownItemText, item === country && styles.dropdownItemTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton title='Save Property' onPress={onCreate} />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
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
  },
  dropdownWrap: {
    gap: spacing.xs
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  dropdownText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.bodyM
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  dropdownItemActive: {
    backgroundColor: colors.primarySoft
  },
  dropdownItemText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.bodyM
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium'
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'Inter_500Medium'
  }
})
