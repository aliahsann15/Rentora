import { ChangePasswordScreen } from '../ChangePasswordScreen'
import { TenantSettingsStackScreenProps } from '../../navigation/types'

type Props = TenantSettingsStackScreenProps<'TenantChangePassword'>

export const TenantChangePasswordScreen = ({ navigation }: Props) => {
  return <ChangePasswordScreen onSuccess={() => navigation.goBack()} />
}
