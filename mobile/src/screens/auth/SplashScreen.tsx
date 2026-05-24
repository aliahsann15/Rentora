import { useEffect, useRef } from 'react'
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from 'react-native'
import { colors } from '../../utils/theme'

type SplashScreenProps = {
  onAnimationComplete?: () => void
}

export const SplashScreen = ({ onAnimationComplete }: SplashScreenProps) => {
  const logoOpacity = useRef(new Animated.Value(0)).current
  const loaderOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(loaderOpacity, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]),
      Animated.delay(120)
    ])

    animation.start(({ finished }) => {
      if (finished) {
        onAnimationComplete?.()
      }
    })

    return () => {
      animation.stop()
    }
  }, [loaderOpacity, logoOpacity, onAnimationComplete])

  return (
    <View style={styles.root}>
      <Animated.Image
        source={require('../../../assets/logo.png')}
        resizeMode='contain'
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }]
          }
        ]}
      />

      <Animated.View style={[styles.loader, { opacity: loaderOpacity }]}>
        <ActivityIndicator color={colors.primary} size='large' />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 220,
    height: 62
  },
  loader: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
})
