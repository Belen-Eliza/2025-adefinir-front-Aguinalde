import { useUserContext } from '@/hooks/useUserContext'
import { SplashScreen } from 'expo-router'

SplashScreen.preventAutoHideAsync()

export function SplashScreenController() {
  const { isLoading } = useUserContext()

  if (!isLoading) {
    SplashScreen.hideAsync()
  }

  return null
}