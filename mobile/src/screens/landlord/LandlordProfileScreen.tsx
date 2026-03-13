import { ProfileScreen } from '../ProfileScreen'
import { ROUTES } from '../../navigation/routes'
import { LandlordSettingsStackScreenProps } from '../../navigation/types'

type Props = LandlordSettingsStackScreenProps<'LandlordProfile'>

export const LandlordProfileScreen = ({ navigation }: Props) => {
  return (
    <ProfileScreen role='LANDLORD' onEditPress={() => navigation.navigate(ROUTES.EDIT_LANDLORD_PROFILE)} />
  )
}
