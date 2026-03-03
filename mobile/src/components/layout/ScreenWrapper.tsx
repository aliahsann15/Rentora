import { ReactNode } from 'react'
import { ScreenContainer } from '../ScreenContainer'

interface ScreenWrapperProps {
  children: ReactNode
}

export const ScreenWrapper = ({ children }: ScreenWrapperProps) => {
  return <ScreenContainer>{children}</ScreenContainer>
}
