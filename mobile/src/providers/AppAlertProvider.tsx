import { createContext, ReactNode, useCallback, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppButton } from '../components/AppButton'
import { colors, radius, shadows, spacing, typography } from '../utils/theme'

export type AppAlertActionStyle = 'default' | 'cancel' | 'destructive'

export interface AppAlertAction {
  text: string
  style?: AppAlertActionStyle
  onPress?: () => void
}

export interface AppAlertOptions {
  title: string
  message?: string
  actions?: AppAlertAction[]
}

interface AppAlertContextValue {
  showAlert: (options: AppAlertOptions) => void
  closeAlert: () => void
}

const defaultAction: AppAlertAction = {
  text: 'OK',
  style: 'default'
}

export const AppAlertContext = createContext<AppAlertContextValue | undefined>(undefined)

export const AppAlertProvider = ({ children }: { children: ReactNode }) => {
  const [activeAlert, setActiveAlert] = useState<AppAlertOptions | null>(null)

  const closeAlert = useCallback(() => {
    setActiveAlert(null)
  }, [])

  const showAlert = useCallback((options: AppAlertOptions) => {
    setActiveAlert({
      ...options,
      actions: options.actions && options.actions.length > 0 ? options.actions : [defaultAction]
    })
  }, [])

  const handleActionPress = useCallback((action: AppAlertAction) => {
    setActiveAlert(null)
    action.onPress?.()
  }, [])

  const contextValue = useMemo(
    () => ({
      showAlert,
      closeAlert
    }),
    [showAlert, closeAlert]
  )

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}

      <Modal
        visible={Boolean(activeAlert)}
        transparent
        animationType='fade'
        onRequestClose={closeAlert}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdropDismiss} onPress={closeAlert} />

          <View style={styles.card}>
            <View style={styles.headerAccent} />
            <Text style={styles.title}>{activeAlert?.title}</Text>
            {activeAlert?.message ? <Text style={styles.message}>{activeAlert.message}</Text> : null}

            <View style={styles.actionsRow}>
              {(activeAlert?.actions || [defaultAction]).map((action, index) => (
                <AppButton
                  key={`${action.text}-${index}`}
                  title={action.text}
                  variant={
                    action.style === 'destructive'
                      ? 'danger'
                      : action.style === 'cancel'
                        ? 'secondary'
                        : 'primary'
                  }
                  style={styles.actionButton}
                  onPress={() => handleActionPress(action)}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
    zIndex: 2
  },
  headerAccent: {
    width: 48,
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight
  },
  title: {
    fontSize: typography.headingM,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  message: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular'
  },
  actionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm
  },
  actionButton: {
    flex: 1,
    height: 42
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    zIndex: 1
  }
})
