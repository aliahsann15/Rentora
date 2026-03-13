import { ChangePasswordScreen as SharedChangePasswordScreen } from '../ChangePasswordScreen'
import { LandlordSettingsStackScreenProps } from '../../navigation/types'

type Props = LandlordSettingsStackScreenProps<'ChangePassword'>

export const ChangePasswordScreen = ({ navigation }: Props) => {
  return <SharedChangePasswordScreen onSuccess={() => navigation.goBack()} />
}
