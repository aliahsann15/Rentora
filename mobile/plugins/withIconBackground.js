const { AndroidConfig, createRunOncePlugin, withAndroidColors } = require('expo/config-plugins')

const { Colors } = AndroidConfig

const ICON_BACKGROUND_COLOR = 'iconBackground'
const PLUGIN_NAME = 'rentora-with-icon-background'
const PLUGIN_VERSION = '1.0.0'

const withIconBackground = (config) => {
  return withAndroidColors(config, (config) => {
    const backgroundColor = config?.android?.adaptiveIcon?.backgroundColor || '#E6F4FE'

    config.modResults = Colors.assignColorValue(config.modResults, {
      name: ICON_BACKGROUND_COLOR,
      value: backgroundColor
    })

    return config
  })
}

module.exports = createRunOncePlugin(withIconBackground, PLUGIN_NAME, PLUGIN_VERSION)