import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
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
  link?: {
    url: string
    label?: string
  }
}

export interface AppToastOptions {
  type: 'success' | 'error' | 'info'
  message: string
  durationMs?: number
}

interface AppAlertContextValue {
  showAlert: (options: AppAlertOptions) => void
  closeAlert: () => void
  showToast: (options: AppToastOptions) => void
}

const defaultAction: AppAlertAction = {
  text: 'OK',
  style: 'default'
}

export const AppAlertContext = createContext<AppAlertContextValue | undefined>(undefined)

export const AppAlertProvider = ({ children }: { children: ReactNode }) => {
  const [activeAlert, setActiveAlert] = useState<AppAlertOptions | null>(null)
  const [activeToast, setActiveToast] = useState<AppToastOptions | null>(null)

  const closeAlert = useCallback(() => {
    setActiveAlert(null)
  }, [])

  const showAlert = useCallback((options: AppAlertOptions) => {
    setActiveAlert({
      ...options,
      actions: options.actions && options.actions.length > 0 ? options.actions : [defaultAction]
    })
  }, [])

  const showToast = useCallback((options: AppToastOptions) => {
    setActiveToast(options)
  }, [])

  const handleActionPress = useCallback((action: AppAlertAction) => {
    setActiveAlert(null)
    action.onPress?.()
  }, [])

  const handleLinkPress = useCallback(async () => {
    if (!activeAlert?.link?.url) {
      return
    }

    try {
      await Linking.openURL(activeAlert.link.url)
    } catch {
      return
    }
  }, [activeAlert])

  const contextValue = useMemo(
    () => ({
      showAlert,
      closeAlert,
      showToast
    }),
    [showAlert, closeAlert, showToast]
  )

  useEffect(() => {
    if (!activeToast) {
      return
    }

    const timeout = setTimeout(() => {
      setActiveToast(null)
    }, activeToast.durationMs || 2600)

    return () => {
      clearTimeout(timeout)
    }
  }, [activeToast])

  const toastContainerStyle = useMemo(() => {
    if (!activeToast) {
      return styles.toastInfo
    }

    if (activeToast.type === 'success') {
      return styles.toastSuccess
    }

    if (activeToast.type === 'error') {
      return styles.toastError
    }

    return styles.toastInfo
  }, [activeToast])

  const toastTextStyle = useMemo(() => {
    if (!activeToast) {
      return styles.toastInfoText
    }

    if (activeToast.type === 'success') {
      return styles.toastSuccessText
    }

    if (activeToast.type === 'error') {
      return styles.toastErrorText
    }

    return styles.toastInfoText
  }, [activeToast])

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
            {activeAlert?.link?.url ? (
              <Pressable onPress={handleLinkPress}>
                <Text style={styles.linkText}>{activeAlert.link.label || activeAlert.link.url}</Text>
              </Pressable>
            ) : null}

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

      {activeToast ? (
        <View pointerEvents='none' style={styles.toastOverlay}>
          <View style={[styles.toastCard, toastContainerStyle]}>
            <Text style={[styles.toastText, toastTextStyle]}>{activeToast.message}</Text>
          </View>
        </View>
      ) : null}
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
  linkText: {
    color: colors.primary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold'
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
  },
  toastOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xl,
    alignItems: 'center'
  },
  toastCard: {
    width: '100%',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    ...shadows.card
  },
  toastText: {
    fontSize: typography.bodyM,
    fontFamily: 'Inter_600SemiBold'
  },
  toastSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success
  },
  toastError: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger
  },
  toastInfo: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight
  },
  toastSuccessText: {
    color: colors.success
  },
  toastErrorText: {
    color: colors.danger
  },
  toastInfoText: {
    color: colors.primary
  }
})
