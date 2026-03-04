import { useContext } from 'react'
import { AppAlertContext } from '../providers/AppAlertProvider'

export const useAppAlert = () => {
  const context = useContext(AppAlertContext)

  if (!context) {
    throw new Error('useAppAlert must be used within an AppAlertProvider')
  }

  return context
}
