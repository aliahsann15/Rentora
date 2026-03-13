import { EditProfileScreen } from '../EditProfileScreen'
import { ROUTES } from '../../navigation/routes'
import { TenantSettingsStackScreenProps } from '../../navigation/types'

type Props = TenantSettingsStackScreenProps<'EditTenantProfile'>

export const EditTenantProfileScreen = ({ navigation }: Props) => {
  return <EditProfileScreen role='TENANT' onSaved={() => navigation.replace(ROUTES.TENANT_PROFILE)} />
}
