import { EditProfileScreen } from '../EditProfileScreen'
import { ROUTES } from '../../navigation/routes'
import { LandlordSettingsStackScreenProps } from '../../navigation/types'

type Props = LandlordSettingsStackScreenProps<'EditLandlordProfile'>

export const EditLandlordProfileScreen = ({ navigation }: Props) => {
  return <EditProfileScreen role='LANDLORD' onSaved={() => navigation.replace(ROUTES.LANDLORD_PROFILE)} />
}
