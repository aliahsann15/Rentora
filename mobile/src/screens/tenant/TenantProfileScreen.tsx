import { ProfileScreen } from '../ProfileScreen'
import { ROUTES } from '../../navigation/routes'
import { TenantSettingsStackScreenProps } from '../../navigation/types'

type Props = TenantSettingsStackScreenProps<'TenantProfile'>

export const TenantProfileScreen = ({ navigation }: Props) => {
  return (
    <ProfileScreen role='TENANT' onEditPress={() => navigation.navigate(ROUTES.EDIT_TENANT_PROFILE)} />
  )
}
